import test from 'ava'
import { compare } from '../src/compare'

const fooHtml = '<div class="foo">bar</div>'

test('ignores css comments', (t) => {
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

  t.is(compare(css1, css2, fooHtml).equal, true)
})

test('detect changes if a property is missing', (t) => {
  const css1 = `
    .foo {
      color: red;
    }
  `

  const css2 = `
    .foo {
      color: red;
    }
  `

  const result = compare(css1, css2, fooHtml)
  t.is(result.equal, true)
  console.log(result.changes)
})
