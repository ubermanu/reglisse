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

  expect((await compare(css1, css2, fooHtml)).equal).toBe(true)
})

test('detect changes if a property is missing', async () => {
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
  expect(result.equal).toBe(false)
  expect(result.changes).toHaveLength(1)
})

test('detect changes if a property is different', async () => {
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
  expect(result.equal).toBe(false)
  expect(result.changes).toHaveLength(1)
})

test('detect changes if a property is extra', async () => {
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

  console.log(result.changes)
  expect(result.equal).toBe(false)
  expect(result.changes).toHaveLength(1)
})
