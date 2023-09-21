import puppeteer, { Viewport } from 'puppeteer'
import { ComputedNode } from './types.ts'

/**
 * Launches a headless browser and returns the computed node tree for the given
 * HTML and CSS.
 */
export async function getComputedNodeTree(
  html: string,
  css: string,
  viewport?: Viewport
): Promise<ComputedNode> {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-zygote'],
  })

  const page = await browser.newPage()
  await page.setContent(html || '<html lang></html>')

  if (typeof css === 'string' && css.length > 0) {
    await page.addStyleTag({ content: css })
  }

  if (viewport) {
    await page.setViewport(viewport)
  }

  const tree = await page.evaluate(() => {
    // Recursive function to crawl the DOM tree and build the tree structure
    function buildTree(
      node: Element,
      parent: ComputedNode | null = null
    ): ComputedNode | null {
      const tagName = node.nodeName.toLowerCase()

      // Remove script, style, and head tags
      if (['script', 'style', 'head'].includes(tagName)) {
        return null
      }

      // Fetch the dimensions of the node
      const clientRect = node.getBoundingClientRect()

      // If the node does not have a parent, it is the root node
      // Get the node index relative to the parent
      // If the node has no siblings, do not add `:nth-child()` to the selector
      // If `html` or `body`, just use the tag name as the selector
      let selector = tagName

      if (parent && node.parentNode && !['html', 'body'].includes(tagName)) {
        selector = `${parent.selector} > ${selector}`

        const siblingNodes = Array.from(node.parentNode.childNodes).filter(
          (child) =>
            child.nodeType === Node.ELEMENT_NODE &&
            ['script', 'style', 'head'].includes(child.nodeName.toLowerCase())
        )

        if (siblingNodes.length > 1) {
          const index = siblingNodes.indexOf(node)
          selector += `:nth-child(${index + 1})`
        }
      }

      const currentNode = {
        selector,
        parent: null,
        children: [],
        pseudos: [],
        rect: {
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height,
        },
        tagName,
        style: {},
      }

      const computedStyles = window.getComputedStyle(node)

      for (let i = 0; i < computedStyles.length; i++) {
        const property = computedStyles[i]
        currentNode.style[property] = computedStyles.getPropertyValue(property)
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
          // TODO: Add pseudo elements (if they are active)
          const childNode = buildTree(
            node.childNodes[i] as Element,
            currentNode
          )

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

  // The issue is that puppeteer doesn't like circular references
  // so we need to resolve them manually.
  resolveParentDependencies(tree)

  return tree
}

function resolveParentDependencies(node: ComputedNode) {
  node.children.forEach((child) => {
    child.parent = node
    resolveParentDependencies(child)
  })
}
