import { createPuppet } from './puppet'

// TODO: Add a way to generate a selector?
export interface ComputedNode {
  children: ComputedNode[]
  pseudos: ComputedNode[]
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  tagName: string
  style: {
    [property: string]: string
  }
}

export async function getComputedNodeTree(
  html: string,
  css: string
): Promise<ComputedNode> {
  const { page, browser } = await createPuppet(html, css)

  const tree = await page.evaluate(() => {
    // Recursive function to crawl the DOM tree and build the tree structure
    function buildTree(node: Element): ComputedNode | null {
      // Remove script, style, and head tags
      if (['script', 'style', 'head'].includes(node.nodeName.toLowerCase())) {
        return null
      }

      // Fetch the dimensions of the node
      const clientRect = node.getBoundingClientRect()

      const currentNode = {
        children: [],
        pseudos: [],
        rect: {
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height,
        },
        tagName: node.nodeName.toLowerCase(),
        style: {},
      }

      const computedStyles = window.getComputedStyle(node)

      for (let i = 0; i < computedStyles.length; i++) {
        const property = computedStyles[i]
        currentNode.style[property] = computedStyles.getPropertyValue(property)
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
          // TODO: Add pseudo elements
          const childNode = buildTree(node.childNodes[i] as Element)
          if (childNode) {
            currentNode.children.push(childNode)
          }
        }
      }

      return currentNode
    }

    return buildTree(document.documentElement)
  })

  await browser.close()

  return tree
}
