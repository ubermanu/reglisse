import { CssDeclarationAST, CssRuleAST, parse } from '@adobe/css-tools'
import Specificity from '@bramus/specificity'
import memo from 'memoizee'
import { Viewport } from 'puppeteer'
// @ts-ignore
import affectedProperties from './affected-properties.json'
import { getComputedNodeTree } from './computed-tree'
import { createSelectorMatcher } from './selector-matcher.ts'
import { CompareResult, ComputedNode, Difference } from './types.ts'

/**
 * Compare two stylesheets from the `same` HTML.
 *
 * Returns a list of CSS differences between the two. If there are no
 * differences, the list will be empty and the `equal` property will be true.
 */
export async function compare(
  css1: string,
  css2: string,
  html: string,
  viewport?: Viewport
): Promise<CompareResult> {
  const beforeNode = await getComputedNodeTree(html, css1, viewport)
  const afterNode = await getComputedNodeTree(html, css2, viewport)

  // Compare the two computed node trees and return a list of changes
  let changes = compareComputedNodes(beforeNode, afterNode)

  // Remove duplicate changes
  changes = changes.filter((change, index) => {
    const firstIndex = changes.findIndex(
      (c) =>
        c.property === change.property &&
        c.computedNode.selector === change.computedNode.selector
    )
    return firstIndex === index
  })

  // console.log(changes)

  // Parse the new CSS source to find the declarations that affect the changes
  const ast = parse(css2)
  const rules = ast.stylesheet.rules

  const selectorMatcher = createSelectorMatcher(html)

  interface SelectorRule {
    selectors: string[]
    specificities: Specificity[]
    cssRule: CssRuleAST
  }

  // Find the CSS rules for a given computed node (including parent selectors)
  const findSelectorRules = memo(
    (computedNode: ComputedNode): SelectorRule[] => {
      const selectorRules: SelectorRule[] = []
      let node = computedNode

      console.log('findSelectorRules', computedNode.selector)

      while (node) {
        const r = rules.filter((rule) => rule.type === 'rule') as CssRuleAST[]

        r.forEach((rule) => {
          const selectors = rule.selectors.filter((selector) =>
            selectorMatcher.matches(computedNode.selector, selector)
          )

          console.log('rule:', rule.selectors.join(', '))
          console.log('selectors:', selectors.join(', '))

          // If the rule matches the selector, add it to the list
          if (selectors.length > 0) {
            const specificities = Specificity.calculate(selectors.join(', '))
            selectorRules.push({ selectors, specificities, cssRule: rule })
          }
        })

        node = node.parent
      }
      return selectorRules
    }
  )

  changes.forEach((change) => {
    console.log('change:', change.property)

    // Get all the rules that could affect this change (based on the selector)
    // Include the rules from the parent selectors
    const selectorRules = findSelectorRules(change.computedNode)

    const selectorRulesWithDeclarations = selectorRules.filter(
      (selectorRule) => {
        const { selectors, cssRule } = selectorRule

        // Filter the rules that do not contain: the property or `all` or a matching
        // combined property
        const declarations = cssRule.declarations.filter((decl) => {
          if (decl.type !== 'declaration') {
            return false
          }
          if (decl.property === change.property) {
            return true
          }
          if (decl.property === 'all') {
            return true
          }
          // Check if the property is a combined property (e.g. `margin`)
          if (
            affectedProperties[decl.property] &&
            affectedProperties[decl.property].includes(change.property)
          ) {
            return true
          }
        })

        return declarations.length > 0
      }
    )

    // TODO: Check that the rules are sorted from high to low specificity
    const sortedSelectorRules = selectorRulesWithDeclarations.sort((a, b) => {
      const aSpec = Specificity.max(...a.specificities)
      const bSpec = Specificity.max(...b.specificities)
      return Specificity.compare(aSpec, bSpec)
    })

    console.log(sortedSelectorRules.length)
    console.log(sortedSelectorRules.map((r) => r.selectors.join(', ')))
    console.log('---')

    // For each selector rule, find the declarations that affect the change
    // We stop at important
    for (const selectorRule of sortedSelectorRules) {
      const { cssRule } = selectorRule

      const declarations = cssRule.declarations.filter(
        (decl) => decl.type === 'declaration'
      ) as CssDeclarationAST[]

      let responsibleDeclaration: CssDeclarationAST | null = null

      /**
       * Returns TRUE if the declaration property can affect the changed
       * property.
       */
      function canAffect(declProp: string, changeProp: string): boolean {
        return (
          declProp === changeProp ||
          declProp === 'all' ||
          (affectedProperties[declProp] &&
            affectedProperties[declProp].includes(changeProp))
        )
      }

      // TODO: Start with the latest declaration in the AST
      // TODO: Handle `inherit` and `currentColor`
      for (const decl of declarations.reverse()) {
        if (!canAffect(decl.property, change.property)) {
          continue
        }

        // @ts-ignore
        if (responsibleDeclaration && !decl.important) {
          // It has to be `!important` to override the previous declaration
          continue
        }

        responsibleDeclaration = decl
      }

      if (responsibleDeclaration) {
        console.log('responsibleDeclaration:', responsibleDeclaration)
        change.cssDeclaration = responsibleDeclaration
        break
      }
    }
  })

  // Remove changes that are not affected by CSS rules
  changes = changes.filter((change) => change.cssDeclaration !== null)

  return { equal: changes.length === 0, changes }
}

/**
 * Compare two style trees and return a list of differences. The two trees
 * `should` be the exact same structure but with different styles.
 *
 * @recursive
 */
function compareComputedNodes(
  beforeNode: ComputedNode,
  afterNode: ComputedNode
): Difference[] {
  const changes = []

  // Compare the styles of the two nodes.
  const before_styles = beforeNode.style
  const after_styles = afterNode.style

  for (let property in before_styles) {
    if (before_styles[property] !== after_styles[property]) {
      changes.push({
        property,
        before: before_styles[property],
        after: after_styles[property],
        computedNode: afterNode,
        cssDeclaration: null,
      })
    }
  }

  // Compare the dimensions of the two nodes.
  const before_rect = beforeNode.rect
  const after_rect = afterNode.rect

  const tests = {
    x: before_rect.x !== after_rect.x,
    y: before_rect.y !== after_rect.y,
    width: before_rect.width !== after_rect.width,
    height: before_rect.height !== after_rect.height,
  }

  Object.entries(tests).forEach(([property, hasChanged]) => {
    if (hasChanged) {
      changes.push({
        property,
        before: before_rect[property].toString(),
        after: after_rect[property].toString(),
        computedNode: afterNode,
        cssDeclaration: null,
      })
    }
  })

  // Compare the children of the two nodes.
  const children1 = beforeNode.children
  const children2 = afterNode.children

  // TODO: Compare pseudo elements

  for (let i = 0; i < children1.length; i++) {
    const childChanges = compareComputedNodes(children1[i], children2[i])
    changes.push(...childChanges)
  }

  return changes
}
