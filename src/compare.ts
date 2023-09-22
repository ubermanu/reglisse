import { Viewport } from 'puppeteer'
import { getComputedNodeTree } from './computed-tree'
import { findNodeDeclaration } from './find-node-declaration.ts'
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

  // Remove the change if there is no rule that affects it,
  // It might be a side effect of another property change
  changes = changes.filter((change) => {
    return change.prev.cssDeclaration || change.next.cssDeclaration
  })

  // console.log(
  //   changes.map(({ property, prev, next }) => ({
  //     property,
  //     prev: prev.value,
  //     next: next.value,
  //   }))
  // )

  return { equal: changes.length === 0, changes }
}

/**
 * Compare two computed nodes and return a list of differences. The two trees
 * `should` be the exact same structure but with different styles.
 *
 * @recursive
 */
function compareComputedNodes(
  prevNode: ComputedNode,
  nextNode: ComputedNode
): Difference[] {
  let changes: Difference[] = []

  // Compare the styles of the two nodes.
  const prevStyles = prevNode.style
  const nextStyles = nextNode.style

  for (let property in prevStyles) {
    if (prevStyles[property] !== nextStyles[property]) {
      changes.push({
        property,
        prev: {
          value: prevStyles[property],
          computedNode: prevNode,
          cssRule: null,
          cssDeclaration: null,
        },
        next: {
          value: nextStyles[property],
          computedNode: nextNode,
          cssRule: null,
          cssDeclaration: null,
        },
      } as Difference)
    }
  }

  // Compare the dimensions of the two nodes.
  const before_rect = prevNode.rect
  const after_rect = nextNode.rect

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
        prev: {
          value: before_rect[property],
          computedNode: prevNode,
          cssDeclaration: null,
        },
        next: {
          value: after_rect[property],
          computedNode: nextNode,
          cssDeclaration: null,
        },
      })
    }
  })

  // Compare the children of the two nodes.
  const children1 = prevNode.children
  const children2 = nextNode.children

  // TODO: Compare pseudo elements

  for (let i = 0; i < children1.length; i++) {
    const childChanges = compareComputedNodes(children1[i], children2[i])
    changes.push(...childChanges)
  }

  // Remove duplicate changes
  changes = changes.filter((change, index) => {
    const firstIndex = changes.findIndex(
      (c) =>
        c.property === change.property &&
        c.prev.computedNode.selector === change.prev.computedNode.selector
    )
    return firstIndex === index
  })

  // Assign the css declaration to each change state
  for (const change of changes) {
    change.prev.cssDeclaration = findNodeDeclaration(
      change.prev.computedNode,
      change.property
    )

    change.next.cssDeclaration = findNodeDeclaration(
      change.next.computedNode,
      change.property
    )
  }

  return changes
}
