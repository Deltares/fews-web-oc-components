import { describe, test, expect } from 'vitest'
import { findClosestIndex } from '.'

describe('Find closest index', () => {
  test('with ascending numbers', () => {
    const result = findClosestIndex([1, 2, 3, 4, 5], 3.5, (a, b) => a - b)

    expect(result).toBe(2)
  })

  test('with descending numbers', () => {
    const result = findClosestIndex([5, 4, 3, 2, 1], 3.5, (a, b) => a - b)

    expect(result).toBe(2)
  })

  test('with empty array', () => {
    const result = findClosestIndex([], 3.5, (a, b) => a - b)

    expect(result).toBe(-1)
  })

  test('with single element', () => {
    const result = findClosestIndex([3], 3.5, (a, b) => a - b)

    expect(result).toBe(0)
  })

  test('with target less than first element', () => {
    const result = findClosestIndex([1, 2, 3, 4, 5], 0, (a, b) => a - b)

    expect(result).toBe(0)
  })

  test('with target greater than last element', () => {
    const result = findClosestIndex([1, 2, 3, 4, 5], 6, (a, b) => a - b)

    expect(result).toBe(4)
  })

  test('with flooring number comparator', () => {
    const result = findClosestIndex([1, 2, 3, 4, 5], 3.6, (a, b) => {
      return a <= b ? a - b : Infinity
    })

    expect(result).toBe(2)
  })
})
