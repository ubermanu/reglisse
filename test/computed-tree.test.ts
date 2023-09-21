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
