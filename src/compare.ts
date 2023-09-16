import { getComputedStyleTree, StyledNode } from './style-tree'

export interface CompareResult {
  equal: boolean
  changes: Diff[]
}

interface Diff {
  level: 'error' | 'warning'
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
  const tree1 = getComputedStyleTree(html, css1)
  const tree2 = getComputedStyleTree(html, css2)

  // Compare the two final styles trees and return a list of differences.
  // TODO: Take into account the HTML structure of the document
  const changes = compareStyledNodes(tree1, tree2)

  return { equal: changes.length === 0, changes }
}

/**
 * Compare two style trees and return a list of differences. The two trees
 * `should` be the exact same structure but with different styles.
 *
 * @recursive
 */
function compareStyledNodes(node1: StyledNode, node2: StyledNode): Diff[] {
  const changes = []

  // Compare the styles of the two nodes.
  const styles1 = node1.style
  const styles2 = node2.style

  for (let property in styles1) {
    if (!styles2.hasOwnProperty(property)) {
      changes.push({
        level: 'error',
        message: `Property ${property} is missing`,
        selector: node1.tagName,
        property,
        before: styles1[property],
        after: '',
      })
    } else if (styles1[property] !== styles2[property]) {
      changes.push({
        level: 'error',
        message: `Property ${property} is different`,
        selector: node1.tagName,
        property,
        before: styles1[property],
        after: styles2[property],
      })
    }
  }

  for (let property in styles2) {
    if (!styles1.hasOwnProperty(property)) {
      changes.push({
        level: 'error',
        message: `Property ${property} is missing`,
        selector: node1.tagName,
        property,
        before: '',
        after: styles2[property],
      })
    } else if (styles1[property] !== styles2[property]) {
      changes.push({
        level: 'error',
        message: `Property ${property} is different`,
        selector: node1.tagName,
        property,
        before: styles1[property],
        after: styles2[property],
      })
    }
  }

  // Compare the children of the two nodes.
  const children1 = node1.children
  const children2 = node2.children

  for (let i = 0; i < children1.length; i++) {
    const childChanges = compareStyledNodes(children1[i], children2[i])
    changes.push(...childChanges)
  }

  return changes
}
