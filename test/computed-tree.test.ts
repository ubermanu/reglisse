import { expect, test } from 'bun:test'
import { getComputedNodeTree } from '../src/computed-tree'

const fooHtml = '<div>foo</div>'

test('returns the default computed tree for empty html', async () => {
  const tree = await getComputedNodeTree('', '')

  expect(tree.tagName).toBe('html')
  expect(tree.children).toHaveLength(1)
  expect(tree.children[0].tagName).toBe('body')
  expect(tree.children[0].children).toHaveLength(0)
})

test('returns the computed tree for html with a div', async () => {
  const tree = await getComputedNodeTree(fooHtml, '')

  expect(tree.tagName).toBe('html')
  expect(tree.children).toHaveLength(1)
  expect(tree.children[0].tagName).toBe('body')
  expect(tree.children[0].children).toHaveLength(1)
  expect(tree.children[0].children[0].tagName).toBe('div')
})

test('the selector of each node is precise', async () => {
  const tree = await getComputedNodeTree(
    '<div>foo</div><div>bar</div><div>baz</div>',
    ''
  )

  expect(tree.selector).toBe('html')
  expect(tree.children[0].selector).toBe('body')
  expect(tree.children[0].children[0].selector).toBe('body > div:nth-child(1)')
  expect(tree.children[0].children[1].selector).toBe('body > div:nth-child(2)')
  expect(tree.children[0].children[2].selector).toBe('body > div:nth-child(3)')
})

test('setting the color of html sets the color of the body', async () => {
  const tree = await getComputedNodeTree(fooHtml, 'html { color: red; }')

  expect(tree.style.color).toBe('rgb(255, 0, 0)')
  expect(tree.children[0].style.color).toBe('rgb(255, 0, 0)')
  expect(tree.children[0].children[0].style.color).toBe('rgb(255, 0, 0)')
})

test('setting a property on a tag sets the property on the tag', async () => {
  const tree = await getComputedNodeTree(fooHtml, 'div { color: red; }')

  expect(tree.style.color).toBe('rgb(0, 0, 0)')
  expect(tree.children[0].style.color).toBe('rgb(0, 0, 0)')
  expect(tree.children[0].children[0].style.color).toBe('rgb(255, 0, 0)')
})

test('the css rule is correctly defined', async () => {
  const tree = await getComputedNodeTree(
    '<div class="foo">foo</div><div class="bar">bar</div><div class="baz">baz</div>',
    'html { font-size: 10px; } .foo { color: red; } .bar { color: blue; }'
  )

  expect(tree.cssRules).toHaveLength(1)
  expect(tree.cssRules[0].selectors).toEqual(['html'])

  expect(tree.children[0].children[0].cssRules).toHaveLength(1)
  expect(tree.children[0].children[0].cssRules[0].selectors).toEqual(['.foo'])

  expect(tree.children[0].children[1].cssRules).toHaveLength(1)
  expect(tree.children[0].children[1].cssRules[0].selectors).toEqual(['.bar'])

  expect(tree.children[0].children[2].cssRules).toHaveLength(0)
})
