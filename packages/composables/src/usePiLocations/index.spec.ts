import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref, type EffectScope } from 'vue'
import {
  DocumentFormat,
  type Location as PiLocation,
  type LocationsFilter,
} from '@deltares/fews-pi-requests'
import type { FeatureCollection, Geometry } from 'geojson'
import { usePiLocations, type UsePiLocationsOptions } from './index.js'

const baseUrl = 'https://example.localhost/fewswebservices'
const locationsUrl = `${baseUrl}/rest/fewspiservice/v1/locations`

interface PendingRequest {
  request: Request
  respond: (body: unknown, status?: number) => void
}

const locationResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [4.9, 52.4] },
      properties: { locationId: 'location-1', lat: 52.4, lon: 4.9 },
    },
  ],
} as unknown as FeatureCollection<Geometry, PiLocation>

let pending: PendingRequest[]
let fetchMock: ReturnType<typeof vi.fn>
let scopes: EffectScope[]

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

function setup(options: Partial<UsePiLocationsOptions> = {}) {
  const scope = effectScope()
  scopes.push(scope)
  const result = scope.run(() =>
    usePiLocations({
      filter: ref<LocationsFilter>({ filterId: 'example' }),
      webservice: { baseUrl },
      refresh: { policies: [], immediate: false },
      ...options,
    }),
  )!
  return { ...result, scope }
}

describe('usePiLocations', () => {
  beforeEach(() => {
    pending = []
    scopes = []
    fetchMock = vi.fn(
      (request: Request) =>
        new Promise<Response>((resolve, reject) => {
          request.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
          pending.push({
            request,
            respond: (body, status = 200) =>
              resolve(
                new Response(JSON.stringify(body), {
                  status,
                  headers: { 'Content-Type': 'application/json' },
                }),
              ),
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(async () => {
    scopes.forEach((scope) => scope.stop())
    await flush()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches locations using the current filter and exposes the response', async () => {
    const { fetch, locations, geojson, loading, refreshing, hasLoaded, isEmpty } =
      setup()

    const fetchPromise = fetch()
    expect(loading.value).toBe(true)
    expect(refreshing.value).toBe(false)
    await flush()

    const request = pending[0].request
    const url = new URL(request.url)
    expect(`${url.origin}${url.pathname}`).toBe(locationsUrl)
    expect(url.searchParams.get('filterId')).toBe('example')
    expect(url.searchParams.get('documentFormat')).toBe(DocumentFormat.GEO_JSON)

    pending[0].respond(locationResponse)
    await fetchPromise

    expect(geojson.value).toEqual(locationResponse)
    expect(locations.value).toEqual([locationResponse.features[0].properties])
    expect(hasLoaded.value).toBe(true)
    expect(isEmpty.value).toBe(false)
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(false)
  })

  it('reports an empty successful result', async () => {
    const { fetch, isEmpty, hasLoaded, locations } = setup()
    const fetchPromise = fetch()
    await flush()
    pending[0].respond({ type: 'FeatureCollection', features: [] })
    await fetchPromise

    expect(hasLoaded.value).toBe(true)
    expect(isEmpty.value).toBe(true)
    expect(locations.value).toEqual([])
  })

  it('reports request errors and rethrows them', async () => {
    const { fetch, error, hasLoaded, loading } = setup()
    const fetchPromise = fetch()
    await flush()
    pending[0].respond({}, 500)

    await expect(fetchPromise).rejects.toThrow()
    expect(error.value).toBeInstanceOf(Error)
    expect(hasLoaded.value).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('aborts the previous request when fetching again', async () => {
    const { fetch, geojson } = setup()
    const firstFetch = fetch()
    await flush()
    const firstRequest = pending[0].request

    const secondFetch = fetch()
    await flush()
    const secondRequest = pending[pending.length - 1]

    expect(firstRequest.signal.aborted).toBe(true)
    secondRequest.respond(locationResponse)
    await Promise.all([firstFetch, secondFetch])
    expect(geojson.value).toEqual(locationResponse)
  })

  it('cancels the current request without reporting an error', async () => {
    const { fetch, cancel, loading, refreshing, error } = setup()
    const fetchPromise = fetch()
    await flush()
    const request = pending[0].request

    cancel()
    await fetchPromise

    expect(request.signal.aborted).toBe(true)
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(false)
  })

  it('does not fetch while disabled', async () => {
    const enabled = ref(false)
    const { fetch, loading } = setup({ enabled })

    await fetch()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('aborts requests when its scope is disposed', async () => {
    const { fetch, scope } = setup()
    const fetchPromise = fetch()
    await flush()
    const request = pending[0].request

    scope.stop()
    await fetchPromise

    expect(request.signal.aborted).toBe(true)
  })

  it('uses authorization headers from the webservice options', async () => {
    const { fetch } = setup({
      webservice: {
        baseUrl,
        getAuthorizationHeaders: async () =>
          new Headers({ Authorization: 'Bearer token' }),
      },
    })
    const fetchPromise = fetch()
    await flush()

    expect(pending[0].request.headers.get('Authorization')).toBe('Bearer token')
    pending[0].respond(locationResponse)
    await fetchPromise
  })
})
