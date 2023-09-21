import { CssDeclarationAST } from '@adobe/css-tools'

export interface CompareResult {
  equal: boolean
  changes: Difference[]
}

/**
 * The computed context regroups the computed value, the computed node, and the
 * CSS rule and declaration that affect the computed value.
 */
type ComputedContext = {
  /** The computed value of the CSS property. */
  value: string

  /** The computed node that is affected by the CSS declaration. */
  computedNode: ComputedNode

  /** The CSS declaration that affects the computed value. */
  cssDeclaration: CssDeclarationAST | null
}

export interface Difference {
  /**
   * The CSS property that changed. The property is not a combined property
   * (e.g. `margin`), but a single property (e.g. `margin-top`).
   */
  property: string

  /** The context before the change. */
  prev: ComputedContext

  /** The context after the change. */
  next: ComputedContext
}

export interface ComputedNode {
  /**
   * The `precise` CSS selector for the node. This selector will only match the
   * HTML element and no other elements.
   */
  selector: string

  /**
   * The parent node of this node. If this node is the root node, this will be
   * `null`.
   */
  parent: ComputedNode | null

  /**
   * The children of this node. If this node has no children, this will be an
   * empty array.
   */
  children: ComputedNode[]

  /**
   * The pseudo elements of this node. If this node has no pseudo elements, this
   * will be an empty array.
   */
  pseudos: ComputedNode[]

  /** The dimensions of the node in pixels. */
  rect: {
    x: number
    y: number
    width: number
    height: number
  }

  /**
   * The tag name of the node. This will be `html` for the root node, `body` for
   * the body node, and the tag name for all other nodes.
   */
  tagName: string

  /**
   * The computed styles of the node. This is a map of CSS property names to
   * values.
   */
  style: {
    [property: string]: string
  }
}
