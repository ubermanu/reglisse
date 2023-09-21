import { ComputedNode, getComputedNodeTree } from './computed-tree.ts'

export interface CompareResult {
  equal: boolean
  changes: Difference[]
}

interface Difference {
  message: string
  selector: string
  property: string
  before: string
  after: string

  // TODO: A list of CSS rules that affect this change
  // cssRules: string[]
}

/**
 * Compare two stylesheets from the same HTML.
 *
 * Returns a list of CSS differences between the two. If there are no
 * differences, the list will be empty and the `equal` property will be true.
 */
export async function compare(
  css1: string,
  css2: string,
  html: string,
  viewport?: { width: number; height: number }
): Promise<CompareResult> {
  const beforeNode = await getComputedNodeTree(html, css1)
  const afterNode = await getComputedNodeTree(html, css2)

  // Compare the two final styles trees and return a list of differences.
  // TODO: Take into account the HTML structure of the document
  const changes = compareComputedNodes(beforeNode, afterNode)

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
        message: `"${property}" is different in "${afterNode.tagName}"`,
        selector: beforeNode.tagName,
        property,
        before: before_styles[property],
        after: after_styles[property],
      })
    }
  }

  // Compare the dimensions of the two nodes.
  const before_rect = beforeNode.rect
  const after_rect = afterNode.rect

  if (before_rect.x !== after_rect.x) {
    changes.push({
      message: `"x" is different in "${afterNode.tagName}"`,
      selector: beforeNode.tagName,
      property: 'x',
      before: before_rect.x.toString(),
      after: after_rect.x.toString(),
    })
  }

  if (before_rect.y !== after_rect.y) {
    changes.push({
      message: `"y" is different in "${afterNode.tagName}"`,
      selector: beforeNode.tagName,
      property: 'y',
      before: before_rect.y.toString(),
      after: after_rect.y.toString(),
    })
  }

  if (before_rect.width !== after_rect.width) {
    changes.push({
      message: `"width" is different in "${afterNode.tagName}"`,
      selector: beforeNode.tagName,
      property: 'width',
      before: before_rect.width.toString(),
      after: after_rect.width.toString(),
    })
  }

  if (before_rect.height !== after_rect.height) {
    changes.push({
      message: `"height" is different in "${afterNode.tagName}"`,
      selector: beforeNode.tagName,
      property: 'height',
      before: before_rect.height.toString(),
      after: after_rect.height.toString(),
    })
  }

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
