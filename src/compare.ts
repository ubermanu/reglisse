import { getComputedStyleTree, StyledNode } from './style-tree'

export interface CompareResult {
  equal: boolean
  changes: Diff[]
}

interface Diff {
  type: 'missing' | 'different' | 'extra'
  message: string
  selector: string
  property: string
  before: string
  after: string
}

/**
 * Compare two stylesheets from the same HTML.
 *
 * Returns a list of CSS differences between the two. If there are no
 * differences, the list will be empty and the `equal` property will be true.
 */
export function compare(
  css1: string,
  css2: string,
  html: string
): CompareResult {
  const beforeNode = getComputedStyleTree(html, css1)
  const afterNode = getComputedStyleTree(html, css2)

  // Compare the two final styles trees and return a list of differences.
  // TODO: Take into account the HTML structure of the document
  const changes = compareStyledNodes(beforeNode, afterNode)

  return { equal: changes.length === 0, changes }
}

/**
 * Compare two style trees and return a list of differences. The two trees
 * `should` be the exact same structure but with different styles.
 *
 * @recursive
 */
function compareStyledNodes(beforeNode: StyledNode, afterNode: StyledNode): Diff[] {
  const changes = []

  // Compare the styles of the two nodes.
  const before_styles = beforeNode.style
  const after_styles = afterNode.style

  for (let property in before_styles) {
    if (!after_styles.hasOwnProperty(property)) {
      changes.push({
        type: 'missing',
        message: `"${property}" has been removed from "${afterNode.tagName}"`,
        selector: beforeNode.tagName,
        property,
        before: before_styles[property],
        after: '',
      })
    } else if (before_styles[property] !== after_styles[property]) {
      changes.push({
        type: 'different',
        message: `"${property}" is different in "${afterNode.tagName}"`,
        selector: beforeNode.tagName,
        property,
        before: before_styles[property],
        after: after_styles[property],
      })
    }
  }

  for (let property in after_styles) {
    if (!before_styles.hasOwnProperty(property)) {
      changes.push({
        type: 'extra',
        message: `"${property}" has been added to "${afterNode.tagName}"`,
        selector: beforeNode.tagName,
        property,
        before: '',
        after: after_styles[property],
      })
    }
  }

  // Compare the children of the two nodes.
  const children1 = beforeNode.children
  const children2 = afterNode.children

  for (let i = 0; i < children1.length; i++) {
    const childChanges = compareStyledNodes(children1[i], children2[i])
    changes.push(...childChanges)
  }

  return changes
}
