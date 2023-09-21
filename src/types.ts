import { CssAtRuleAST } from '@adobe/css-tools'

export interface CompareResult {
  equal: boolean
  changes: Difference[]
}

export interface Difference {
  /** The CSS property that changed. */
  property: string

  /** The value before the change. */
  before: string

  /** The value after the change. */
  after: string

  /** The computed node (HTML Element) that changed. */
  computedNode: ComputedNode

  /** The CSS rules that affect this change. */
  cssRules?: CssAtRuleAST[]
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
