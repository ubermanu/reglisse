import { expect, test } from 'bun:test'
import { compare } from '../src/compare'

const fooHtml = '<div class="foo">bar</div>'

test('ignores css comments', async () => {
  const css1 = `
    /* Comment */
    .foo {
      font-size: 16px;
      color: red;
    }
  `

  const css2 = `
    .foo {
      font-size: 16px;
      color: red;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.equal).toBe(true)
  expect(result.changes).toHaveLength(0)
})

test('property is deleted', async () => {
  const css1 = `
    .foo {
      color: red;
      font-size: 10px;
    }
  `

  const css2 = `
    .foo {
      color: red;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(1)

  expect(result.changes[0].property).toBe('font-size')

  expect(result.changes[0].prev.value).toBe('10px')
  expect(result.changes[0].next.value).not.toBe('10px')

  expect(result.changes[0].prev.cssDeclaration).not.toBe(null)
  expect(result.changes[0].next.cssDeclaration).toBe(null)
})

test('property is different', async () => {
  const css1 = `
    .foo {
      font-size: 10px;
    }
  `

  const css2 = `
    .foo {
      font-size: 20px;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(1)

  expect(result.changes[0].property).toBe('font-size')

  expect(result.changes[0].prev.value).toBe('10px')
  expect(result.changes[0].next.value).toBe('20px')

  expect(result.changes[0].prev.cssDeclaration).not.toBe(null)
  expect(result.changes[0].next.cssDeclaration).not.toBe(null)
})

test('property is extra', async () => {
  const css1 = `
    .foo {
      color: red;
    }
  `

  const css2 = `
    .foo {
      color: red;
      font-size: 10px;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(1)
})

test('rule deleted and inherits prop by default', async () => {
  const css1 = `
    html {
      font-size: 20px;
    }
    div {
      font-size: 8px;
    }
  `

  const css2 = `
    html {
      font-size: 20px;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(1)

  expect(result.changes[0].property).toBe('font-size')

  expect(result.changes[0].prev.value).toBe('8px')
  expect(result.changes[0].next.value).toBe('20px')

  expect(result.changes[0].next.cssDeclaration).not.toBe(null)
  expect(result.changes[0].next.cssDeclaration.value).toBe('20px')
})

test('declaration value is set to inherit', async () => {
  const css1 = `
    html {
      font-size: 20px;
    }
    div {
      font-size: 10px;
    }
  `

  const css2 = `
    html {
      font-size: 20px;
    }
    div {
      font-size: inherit;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(1)

  expect(result.changes[0].property).toBe('font-size')
  expect(result.changes[0].next.cssDeclaration.value).toBe('20px')
})

test('replaced by a shorthand declaration for same property', async () => {
  const css1 = `
    div {
      margin-left: 10px;
    }
  `

  const css2 = `
    div {
      margin: 10px;
    }
  `

  const result = await compare(css1, css2, fooHtml)
  expect(result.changes).toHaveLength(3)

  expect(result.changes[0].property).toBe('margin-bottom')
  expect(result.changes[0].next.cssDeclaration.value).toBe('10px')

  expect(result.changes[1].property).toBe('margin-right')
  expect(result.changes[1].next.cssDeclaration.value).toBe('10px')

  expect(result.changes[2].property).toBe('margin-top')
  expect(result.changes[2].next.cssDeclaration.value).toBe('10px')
})
