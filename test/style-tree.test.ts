import test from 'ava'
import { getComputedStyleTree } from '../src/style-tree'

test('returns the default style tree for empty html', (t) => {
  const tree = getComputedStyleTree('', '')

  t.is(tree.tagName, 'html')
  t.is(tree.children.length, 2)
  t.is(tree.children[0].tagName, 'head')
  t.is(tree.children[1].tagName, 'body')
})

test('returns the style tree for html with a div', (t) => {
  const tree = getComputedStyleTree('<div>foo</div>', '')

  t.is(tree.tagName, 'html')
  t.is(tree.children.length, 2)
  t.is(tree.children[0].tagName, 'head')
  t.is(tree.children[1].tagName, 'body')
  t.is(tree.children[1].children.length, 1)
  t.is(tree.children[1].children[0].tagName, 'div')
})

test('setting the color of html sets the color of the body', (t) => {
  const tree = getComputedStyleTree('<div>foo</div>', 'html { color: red; }')

  t.is(tree.children[1].style.color, 'rgb(255, 0, 0)')
  t.is(tree.children[1].style.color, 'rgb(255, 0, 0)')
  t.is(tree.children[1].children[0].style.color, 'rgb(255, 0, 0)')
})

test('setting a property on a tag sets the property on the tag', (t) => {
  const tree = getComputedStyleTree('<div>foo</div>', 'div { color: red; }')

  t.is(tree.children[1].style.color, undefined)
  t.is(tree.children[1].children[0].style.color, 'rgb(255, 0, 0)')
})
