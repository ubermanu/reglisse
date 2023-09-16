import { JSDOM } from 'jsdom'

// TODO: Add a way to generate a selector?
export interface StyledNode {
  children: StyledNode[]
  tagName: string
  style: {
    [property: string]: string
  }
}

export function getComputedStyleTree(html: string, css: string): StyledNode {
  const { window } = new JSDOM(html, { pretendToBeVisual: true })
  const { document, Node } = window

  // TODO: Remove CSS and script tags from the document
  // TODO: Insert browser specific CSS defaults?

  // Insert the new CSS in the head
  const style = document.createElement('style')
  style.innerHTML = css
  document.head.appendChild(style)

  // Recursive function to crawl the DOM tree and build the tree structure
  function buildTree(node: Node): StyledNode {
    const currentNode = {
      children: [],
      tagName: node.nodeName.toLowerCase(),
      style: {},
    }

    const computedStyles = window.getComputedStyle(node as Element)
    for (let i = 0; i < computedStyles.length; i++) {
      const property = computedStyles[i]
      currentNode.style[property] = computedStyles.getPropertyValue(property)
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        // TODO: Add pseudo elements
        const childNode = buildTree(node.childNodes[i])
        currentNode.children.push(childNode)
      }
    }

    return currentNode
  }

  return buildTree(document.documentElement)
}
