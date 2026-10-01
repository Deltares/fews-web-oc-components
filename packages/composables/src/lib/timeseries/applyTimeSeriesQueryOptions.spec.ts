import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTimeSeriesQueryOptions } from './applyTimeSeriesQueryOptions'

const baseUrl =
  'https://example.localhost/rest/fewspiservice/v1/timeseries?filterId=f&locationIds=a'

describe('applyTimeSeriesQueryOptions', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sorts search parameters so equivalent URLs are identical', () => {
    const a = applyTimeSeriesQueryOptions(new URL('https://x.localhost/?b=2&a=1'), {})
    const b = applyTimeSeriesQueryOptions(new URL('https://x.localhost/?a=1&b=2'), {})

    expect(a.toString()).toBe(b.toString())
    expect(a.search).toBe('?a=1&b=2')
  })

  it('does not modify the input URL', () => {
    const url = new URL(baseUrl)

    applyTimeSeriesQueryOptions(url, { onlyHeaders: true })

    expect(url.toString()).toBe(baseUrl)
  })

  it('sets start and end time without milliseconds', () => {
    const url = applyTimeSeriesQueryOptions(new URL(baseUrl), {
      startTime: new Date('2024-01-01T00:00:00.123Z'),
      endTime: new Date('2024-01-02T00:00:00Z'),
    })

    expect(url.searchParams.get('startTime')).toBe('2024-01-01T00:00:00Z')
    expect(url.searchParams.get('endTime')).toBe('2024-01-02T00:00:00Z')
  })

  it('ignores null start and end times', () => {
    const url = applyTimeSeriesQueryOptions(
      new URL(`${baseUrl}&startTime=2024-01-01T00:00:00Z`),
      { startTime: null, endTime: null },
    )

    expect(url.searchParams.get('startTime')).toBe('2024-01-01T00:00:00Z')
    expect(url.searchParams.has('endTime')).toBe(false)
  })

  it('sets boolean flags', () => {
    const url = applyTimeSeriesQueryOptions(new URL(baseUrl), {
      convertDatum: true,
      useDisplayUnits: true,
      onlyHeaders: true,
    })

    expect(url.searchParams.get('convertDatum')).toBe('true')
    expect(url.searchParams.get('useDisplayUnits')).toBe('true')
    expect(url.searchParams.get('onlyHeaders')).toBe('true')
  })

  it('computes thinning from the period and the estimated chart width', () => {
    vi.stubGlobal('outerWidth', 2000)

    const url = applyTimeSeriesQueryOptions(new URL(baseUrl), {
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2024-01-01T01:00:00Z'),
      thinning: true,
    })

    // One hour over half the window width (1000 px).
    expect(url.searchParams.get('thinning')).toBe('3600')
  })

  it('uses the period from the URL for thinning when no times are given', () => {
    vi.stubGlobal('outerWidth', 2000)

    const url = applyTimeSeriesQueryOptions(
      new URL(
        `${baseUrl}&startTime=2024-01-01T00:00:00Z&endTime=2024-01-01T01:00:00Z`,
      ),
      { thinning: true },
    )

    expect(url.searchParams.get('thinning')).toBe('3600')
  })

  it('skips thinning when the period is unknown', () => {
    const url = applyTimeSeriesQueryOptions(new URL(baseUrl), { thinning: true })

    expect(url.searchParams.has('thinning')).toBe(false)
  })
})
