import { describe, expect, test } from 'vitest'
import {
  getCombinedDates,
  getSortedDates,
  getUniqueDates,
  findDateIndex,
} from './dates'

describe('getCombinedDates', () => {
  test.each([
    {
      name: 'combine dates',
      dates1: [new Date('2021-01-01'), new Date('2021-01-02')],
      dates2: [new Date('2021-01-03'), new Date('2021-01-04')],
      expected: [
        new Date('2021-01-01'),
        new Date('2021-01-02'),
        new Date('2021-01-03'),
        new Date('2021-01-04'),
      ],
    },
    {
      name: 'combine dates with duplicates',
      dates1: [new Date('2021-01-01'), new Date('2021-01-02')],
      dates2: [new Date('2021-01-02'), new Date('2021-01-03')],
      expected: [
        new Date('2021-01-01'),
        new Date('2021-01-02'),
        new Date('2021-01-03'),
      ],
    },
    {
      name: 'combine dates with empty arrays',
      dates1: [],
      dates2: [new Date('2021-01-02'), new Date('2021-01-03')],
      expected: [new Date('2021-01-02'), new Date('2021-01-03')],
    },
    {
      name: 'combine dates without sorting',
      dates1: [new Date('2021-01-02'), new Date('2021-01-01')],
      dates2: [new Date('2021-01-03'), new Date('2021-01-04')],
      expected: [
        new Date('2021-01-02'),
        new Date('2021-01-01'),
        new Date('2021-01-03'),
        new Date('2021-01-04'),
      ],
    },
  ])('$name', ({ dates1, dates2, expected }) => {
    expect(getCombinedDates(dates1, dates2)).toEqual(expected)
  })
})

describe('getSortedDates', () => {
  test.each([
    {
      name: 'sort dates',
      dates: [
        new Date('2021-01-02'),
        new Date('2021-01-01'),
        new Date('2021-01-03'),
      ],
      expected: [
        new Date('2021-01-01'),
        new Date('2021-01-02'),
        new Date('2021-01-03'),
      ],
    },
    {
      name: 'sort empty array',
      dates: [],
      expected: [],
    },
  ])('$name', ({ dates, expected }) => {
    expect(getSortedDates(dates)).toEqual(expected)
  })
})

describe('getUniqueDates', () => {
  test.each([
    {
      name: 'return unique dates',
      dates: [
        new Date('2021-01-01'),
        new Date('2021-01-02'),
        new Date('2021-01-01'),
      ],
      expected: [new Date('2021-01-01'), new Date('2021-01-02')],
    },
    {
      name: 'return unique dates from empty array',
      dates: [],
      expected: [],
    },
  ])('$name', ({ dates, expected }) => {
    expect(getUniqueDates(dates)).toEqual(expected)
  })
})

describe('findDateIndex', () => {
  test.each([
    {
      name: 'returns index of exact matching date',
      dates: [
        new Date('2022-01-01'),
        new Date('2022-02-01'),
        new Date('2022-03-01'),
        new Date('2022-04-01'),
      ],
      targetDate: new Date('2022-03-01'),
      expected: 2,
    },
    {
      name: 'returns index of exact ISO8601 date',
      dates: [
        new Date('2022-01-01'),
        new Date('2022-02-01'),
        new Date('2022-03-01'),
        new Date('2022-04-01'),
      ],
      targetDate: new Date('2022-03-01T00:00:00.000Z'),
      expected: 2,
    },
    {
      name: 'returns next index when timestamp is after matching date',
      dates: [
        new Date('2022-01-01'),
        new Date('2022-02-01'),
        new Date('2022-03-01'),
        new Date('2022-04-01'),
      ],
      targetDate: new Date('2022-03-01T00:00:00.100Z'),
      expected: 3,
    },
    {
      name: 'returns 0 when target date is before first date',
      dates: [
        new Date('2022-02-01'),
        new Date('2022-03-01'),
        new Date('2022-04-01'),
      ],
      targetDate: new Date('2022-01-01'),
      expected: 0,
    },
    {
      name: 'returns last index when target date is after latest date',
      dates: [
        new Date('2022-01-01'),
        new Date('2022-02-01'),
        new Date('2022-03-01'),
        new Date('2022-04-01'),
      ],
      targetDate: new Date('2022-05-01'),
      expected: 3,
    },
  ])('$name', ({ dates, targetDate, expected }) => {
    expect(findDateIndex(dates, targetDate)).toBe(expected)
  })
})
