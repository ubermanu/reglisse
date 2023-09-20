import { expect, test } from 'bun:test'
import { getComputedNodeTree } from '../src/style-tree'

test('returns the default style tree for empty html', async () => {
  const tree = await getComputedNodeTree('', '')

  expect(tree.tagName).toBe('html')
  expect(tree.children).toHaveLength(2)
  expect(tree.children[0].tagName).toBe('head')
  expect(tree.children[1].tagName).toBe('body')
})

test('returns the style tree for html with a div', async () => {
  const tree = await getComputedNodeTree('<div>foo</div>', '')

  expect(tree.tagName).toBe('html')
  expect(tree.children).toHaveLength(2)
  expect(tree.children[0].tagName).toBe('head')
  expect(tree.children[1].tagName).toBe('body')
  expect(tree.children[1].children).toHaveLength(1)
  expect(tree.children[1].children[0].tagName).toBe('div')
})

test('setting the color of html sets the color of the body',async () => {
  const tree = await getComputedNodeTree('<div>foo</div>', 'html { color: red; }')

  expect(tree.children[1].style.color).toBe('rgb(255, 0, 0)')
  expect(tree.children[1].children[0].style.color).toBe('rgb(255, 0, 0)')
  expect(tree.children[1].children[0].children[0].style.color).toBe('rgb(255, 0, 0)')
})

test('setting a property on a tag sets the property on the tag',async () => {
  const tree = await getComputedNodeTree('<div>foo</div>', 'div { color: red; }')

  expect(tree.children[1].style.color).toBe('rgb(0, 0, 0)')
  expect(tree.children[1].children[0].style.color).toBe('rgb(255, 0, 0)')
})
