import { parse } from '@adobe/css-tools'
import { Viewport } from 'puppeteer'
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
  const beforeNode = await getComputedNodeTree(html, css1)
  const afterNode = await getComputedNodeTree(html, css2)

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

  // For each change, find the CSS rule that affects it
  // TODO: Climb up the tree and test the parent selectors too
  changes.forEach((change) => {
    const rule = rules.find((rule) => {
      if (rule.type !== 'rule') return false
      return rule.selectors.some((selector) =>
        selectorMatcher.matches(selector, change.computedNode.selector)
      )
    })

    // Add the rule to the change
    if (rule) {
      change.cssRules.push(rule)
    }
  })

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
        cssRules: [],
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
        cssRules: [],
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

  // TODO: Find the CSS rules that affect this change and filter out the ones
  //  that just inherit from the base property.
  //  for example: `font-size` affects `block-size`, `height` etc...
  //  so we need a mechanism to filter out the ones that are not the source of
  //  the change.

  // 1. Find matching CSS rules for the node (in the new stylesheet)
  // 2. Find the CSS rules that affect this property (or a property that can affect it)
  // 3. Add the rules to the `cssRules` property of the difference

  return changes
}
