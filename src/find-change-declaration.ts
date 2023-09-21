import { CssAtRuleAST, CssDeclarationAST, CssRuleAST } from '@adobe/css-tools'
import Specificity from '@bramus/specificity'
import memo from 'memoizee'
// @ts-ignore
import affectedProperties from './affected-properties.json'
import { ComputedNode } from './types.ts'

interface SelectorRule {
  selectors: string[]
  specificities: Specificity[]
  cssRule: CssRuleAST
}

/**
 * Find the CSS rules for a given computed node (including parent selectors) and
 * return a list of rules that match the selector.
 *
 * Sort the rules by specificity (most specific first).
 */
export const findChangeDeclaration = memo(
  (
    computedNode: ComputedNode,
    property: string,
    rules: CssAtRuleAST[],
    selectorMatcher
  ): CssDeclarationAST | null => {
    let selectorRules: SelectorRule[] = []
    let node = computedNode

    while (node) {
      const r = rules.filter((rule) => rule.type === 'rule') as CssRuleAST[]

      r.forEach((rule) => {
        const selectors = rule.selectors.filter((selector) =>
          selectorMatcher.matches(node.selector, selector)
        )

        // If the rule matches the selector, add it to the list
        if (selectors.length > 0) {
          const specificities = Specificity.calculate(selectors.join(', '))
          selectorRules.push({ selectors, specificities, cssRule: rule })
        }
      })

      node = node.parent
    }

    // Sort the rules by specificity (most specific first)
    selectorRules = selectorRules.sort((a, b) => {
      const aSpec = Specificity.max(...a.specificities)
      const bSpec = Specificity.max(...b.specificities)
      return Specificity.compare(aSpec, bSpec)
    })

    // Filter out the rules that do not affect the change in any way
    selectorRules = selectorRules.filter((rule) => {
      return extractDeclarations(rule.cssRule).some((decl) =>
        checkDeclEffect(decl.property, property)
      )
    })

    let cssDeclaration: CssDeclarationAST | null = null

    // Find the specific declarations that affects the change
    for (const selectorRule of selectorRules) {
      const declarations = extractDeclarations(selectorRule.cssRule)

      let responsibleDeclaration: CssDeclarationAST | null = null

      // TODO: Start with the latest declaration in the AST
      // TODO: Handle `inherit` and `currentColor`
      for (const decl of declarations.reverse()) {
        if (!checkDeclEffect(decl.property, property)) {
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
        cssDeclaration = responsibleDeclaration
        break
      }
    }

    // If no declaration was found, it means the property was removed?
    return cssDeclaration
  }
)

/**
 * Returns TRUE if the declaration property can affect the change property.
 *
 * If the declaration property is the same as the change property, it means that
 * the declaration is the one that changed.
 *
 * If the declaration property is `all`, it means that all properties changed.
 *
 * If the declaration property is in the `*.json` file, it means that the
 * declaration property is a shorthand property that affects the change
 * property.
 */
function checkDeclEffect(decl_prop: string, change_prop: string): boolean {
  return (
    decl_prop === change_prop ||
    decl_prop === 'all' ||
    (affectedProperties[decl_prop] &&
      affectedProperties[decl_prop].includes(change_prop))
  )
}

/** Extract the declarations AST from a CSS rule. */
function extractDeclarations(rule: CssRuleAST): CssDeclarationAST[] {
  return rule.declarations.filter(
    (decl) => decl.type === 'declaration'
  ) as CssDeclarationAST[]
}
