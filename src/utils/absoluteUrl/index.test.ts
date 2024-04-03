/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest'
import { absoluteUrl } from '.'

test("absolute url from '/'", () => {
  expect(absoluteUrl('/')).toEqual(new URL('http://localhost:3000/'))
})

test('absolute url from relative url string', () => {
  expect(absoluteUrl('url')).toEqual(new URL('http://localhost:3000/url'))
})

test('absolute url from relative /url string', () => {
  expect(absoluteUrl('/url')).toEqual(new URL('http://localhost:3000/url'))
})

test('absolute url from relative /url/ string', () => {
  expect(absoluteUrl('/url/')).toEqual(new URL('http://localhost:3000/url/'))
})

test('absolute url from absolute url string', () => {
  expect(absoluteUrl('http://localhost:3000/url')).toEqual(
    new URL('http://localhost:3000/url'),
  )
})
