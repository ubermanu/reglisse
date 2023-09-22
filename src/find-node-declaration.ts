import { CssDeclarationAST, CssRuleAST } from '@adobe/css-tools'
import memo from 'memoizee'
import inheritedCssProperties from './css-properties/inherited'
import sideEffectCssProperties from './css-properties/side-effect'
import { ComputedNode } from './types.ts'

/**
 * Find the CSS declaration for a given property in the CSS rules AST of a
 * computed node (including parent selectors) if applicable.
 */
export const findNodeDeclaration = memo(
  (computedNode: ComputedNode, property: string): CssDeclarationAST | null => {
    const nodeRules: CssRuleAST[] = computedNode.cssRules || []
    const parentRules: CssRuleAST[] = []

    // If the property is inheritable, we need to include the parent rules
    // The parent rules are sorted by specificity (most specific first)
    if (inheritedCssProperties.includes(property)) {
      let parent = computedNode.parent

      while (parent) {
        parentRules.push(...(parent.cssRules || []))
        parent = parent.parent
      }
    }

    let curDeclaration: CssDeclarationAST | null = null

    // Find the specific declarations that affects the change
    // Start from the latest rule (which is the computed node rule)
    outer: for (const rule of nodeRules) {
      const declarations = extractDeclarations(rule)

      // Traverse declarations (from bottom to top)
      for (const decl of declarations.reverse()) {
        if (decl.property === property || decl.property === 'all') {
          curDeclaration = decl
          break outer
        }
      }
    }

    // If the declaration has the value `inherit`, we need to check the parent
    // rules for the declaration. If the parent declaration is `inherit`, we
    // need to check the parent's parent rules, and so on.
    if (curDeclaration?.value === 'inherit') {
      outer: for (const rule of parentRules) {
        const declarations = extractDeclarations(rule)

        // Traverse declarations (from bottom to top)
        for (const decl of declarations.reverse()) {
          // It has to match the previous declaration property
          if (decl.property === curDeclaration!.property) {
            if (decl.value === 'inherit') {
              // If the value is `inherit`, we need to check the parent rules
              curDeclaration = decl
              break
            } else {
              // If the value is not `inherit`, we can stop
              break outer
            }
          }
        }
      }
    }

    // If the declaration could not be found in the node rules, check the parent rules
    // if it is an inheritable property
    if (!curDeclaration && inheritedCssProperties.includes(property)) {
      outer: for (const rule of parentRules) {
        const declarations = extractDeclarations(rule)

        // Traverse declarations (from bottom to top)
        for (const decl of declarations.reverse()) {
          // It has to match the previous declaration property
          if (decl.property === property) {
            curDeclaration = decl
            break outer
          }
        }
      }
    }

    // If no declaration was found, it means the property was removed?
    return curDeclaration
  }
)

function extractDeclarations(rule: CssRuleAST): CssDeclarationAST[] {
  return rule.declarations.filter(
    (decl) => decl.type === 'declaration'
  ) as CssDeclarationAST[]
}
