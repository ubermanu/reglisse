import * as cheerio from 'cheerio'

/**
 * Creates an instance of `Cheerio` for a certain HTML string and returns a
 * function that can be used to test if a selector matches another selector.
 */
export function createSelectorMatcher(html: string) {
  const $ = cheerio.load(html)

  return {
    matches(selector1: string, selector2: string) {
      return $(selector1)?.is(selector2) || false
    },
  }
}
