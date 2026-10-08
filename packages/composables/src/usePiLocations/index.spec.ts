import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref, type EffectScope } from 'vue'
import {
  DocumentFormat,
  PiWebserviceProvider,
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
          if (request.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'))
            return
          }
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

  it('does not request locations when the filter is undefined', async () => {
    const filter = ref<LocationsFilter | undefined>(undefined)
    const { fetch, geojson, hasLoaded, hasAttempted, isEmpty } = setup({ filter })

    await fetch()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(geojson.value).toEqual({ type: 'FeatureCollection', features: [] })
    expect(hasLoaded.value).toBe(false)
    expect(hasAttempted.value).toBe(false)
    expect(isEmpty.value).toBe(false)
  })

  it('reports request errors and rethrows them', async () => {
    const { fetch, error, hasLoaded, hasAttempted, isEmpty, loading } = setup()
    const fetchPromise = fetch()
    await flush()
    pending[0].respond({}, 500)

    await expect(fetchPromise).rejects.toThrow()
    expect(error.value).toBeInstanceOf(Error)
    expect(hasLoaded.value).toBe(false)
    expect(hasAttempted.value).toBe(true)
    expect(isEmpty.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('retains the last successful result when a refresh fails', async () => {
    const { fetch, geojson, error, hasLoaded, hasAttempted, isEmpty } = setup()
    const initialFetch = fetch()
    await flush()
    pending[0].respond({ type: 'FeatureCollection', features: [] })
    await initialFetch

    const refresh = fetch()
    await flush()
    pending[1].respond({}, 500)

    await expect(refresh).rejects.toThrow()
    expect(geojson.value.features).toEqual([])
    expect(hasLoaded.value).toBe(true)
    expect(hasAttempted.value).toBe(true)
    expect(isEmpty.value).toBe(true)
    expect(error.value).toBeInstanceOf(Error)
  })

  it('fetches and updates its result when the filter changes', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'first' })
    const { fetch, geojson, hasLoaded, hasAttempted } = setup({ filter })
    const fetchPromise = fetch()
    await flush()
    pending[0].respond(locationResponse)
    await fetchPromise

    filter.value = { filterId: 'second' }
    await flush()

    const refreshedRequest = pending[1].request
    expect(new URL(refreshedRequest.url).searchParams.get('filterId')).toBe(
      'second',
    )
    expect(geojson.value).toEqual({ type: 'FeatureCollection', features: [] })
    expect(hasLoaded.value).toBe(false)
    expect(hasAttempted.value).toBe(false)

    pending[1].respond(locationResponse)
    await flush()

    expect(geojson.value).toEqual(locationResponse)
    expect(hasLoaded.value).toBe(true)
    expect(hasAttempted.value).toBe(true)
  })

  it('clears locations without requesting when the filter becomes undefined', async () => {
    const filter = ref<LocationsFilter | undefined>({ filterId: 'first' })
    const { fetch, geojson, hasLoaded, hasAttempted } = setup({ filter })
    const fetchPromise = fetch()
    await flush()
    const firstRequest = pending[0].request

    filter.value = undefined
    await flush()
    await fetchPromise

    expect(firstRequest.signal.aborted).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(geojson.value).toEqual({ type: 'FeatureCollection', features: [] })
    expect(hasLoaded.value).toBe(false)
    expect(hasAttempted.value).toBe(false)
  })

  it('shares the promise for concurrent identical fetches', async () => {
    const { fetch, geojson } = setup()
    const firstFetch = fetch()
    await flush()
    const firstRequest = pending[0].request

    const secondFetch = fetch()
    await flush()

    expect(secondFetch).toBe(firstFetch)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(firstRequest.signal.aborted).toBe(false)
    pending[0].respond(locationResponse)
    await Promise.all([firstFetch, secondFetch])
    expect(geojson.value).toEqual(locationResponse)
  })

  it('keeps overlapping requests tied to their own signal while authorization resolves', async () => {
    const authorizationResolvers: Array<(headers: Headers) => void> = []
    const getAuthorizationHeaders = vi.fn(
      () =>
        new Promise<Headers>((resolve) => {
          authorizationResolvers.push(resolve)
        }),
    )
    const filter = ref<LocationsFilter>({ filterId: 'first' })
    const { fetch } = setup({
      filter,
      webservice: { baseUrl, getAuthorizationHeaders },
    })

    const firstFetch = fetch()
    await flush()
    filter.value = { filterId: 'second' }
    const secondFetch = fetch()
    await flush()

    authorizationResolvers[0](new Headers())
    await flush()
    const firstRequest = fetchMock.mock.calls[0][0] as Request
    authorizationResolvers[1](new Headers())
    await flush()
    const secondRequest = pending[0].request

    expect(firstRequest.signal.aborted).toBe(true)
    expect(secondRequest.signal.aborted).toBe(false)

    pending[0].respond(locationResponse)
    await Promise.all([firstFetch, secondFetch])
  })

  it('cancels the current request without reporting an error', async () => {
    const { fetch, cancel, loading, refreshing, error } = setup()
    const fetchPromise = fetch()
    await flush()
    const request = pending[0].request

    cancel()
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(false)
    await fetchPromise

    expect(request.signal.aborted).toBe(true)
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(false)
  })

  it('does not reset loaded data when the filter is replaced by an equal object', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, geojson, hasLoaded } = setup({ filter })
    const promise = fetch()
    await flush()
    pending[0].respond(locationResponse)
    await promise

    filter.value = { filterId: 'example' }
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(geojson.value).toEqual(locationResponse)
    expect(hasLoaded.value).toBe(true)
  })

  it('ignores property ordering, undefined options and an explicit default format', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'example', showAttributes: true })
    const { fetch, loading } = setup({ filter })
    const promise = fetch()
    await flush()

    filter.value = {
      showThresholds: undefined,
      documentFormat: DocumentFormat.GEO_JSON,
      showAttributes: true,
      filterId: 'example',
    }
    await flush()
    expect(fetch()).toBe(promise)
    filter.value = { filterId: 'example', showAttributes: true, documentFormat: undefined }
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(pending[0].request.signal.aborted).toBe(false)
    expect(loading.value).toBe(true)
    pending[0].respond(locationResponse)
    await promise
  })

  it('clears loaded results and fetches when a meaningful parameter changes', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, geojson, hasLoaded, loading } = setup({ filter })
    const promise = fetch()
    await flush()
    pending[0].respond(locationResponse)
    await promise

    filter.value = { filterId: 'other' }
    expect(geojson.value.features).toEqual([])
    expect(hasLoaded.value).toBe(false)
    expect(loading.value).toBe(true)
    const changedPromise = fetch()
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new URL(pending[1].request.url).searchParams.get('filterId')).toBe('other')
    pending[1].respond(locationResponse)
    await changedPromise
    expect(geojson.value).toEqual(locationResponse)
  })

  it('preserves array ordering and snapshots parameters before starting a request', async () => {
    const filter = ref<LocationsFilter>({ locationIds: ['first', 'second'] })
    const getLocations = vi.spyOn(PiWebserviceProvider.prototype, 'getLocations')
    const { fetch } = setup({ filter })
    const firstPromise = fetch()
    filter.value.locationIds = ['second', 'first']
    const secondPromise = fetch()
    await flush()

    expect(getLocations).toHaveBeenCalledTimes(2)
    expect(getLocations.mock.calls[0][0]).toEqual({
      documentFormat: DocumentFormat.GEO_JSON,
      locationIds: ['first', 'second'],
    })
    expect(getLocations.mock.calls[1][0]).toEqual({
      documentFormat: DocumentFormat.GEO_JSON,
      locationIds: ['second', 'first'],
    })
    pending[pending.length - 1].respond(locationResponse)
    await Promise.all([firstPromise, secondPromise])
  })

  it('supersedes changed parameters and ignores stale responses without clearing a newer request', async () => {
    fetchMock.mockImplementationOnce((request: Request) =>
      new Promise<Response>((resolve) => {
        pending.push({
          request,
          respond: (body) => resolve(new Response(JSON.stringify(body))),
        })
      }),
    )
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, geojson, loading, error } = setup({ filter })
    const firstPromise = fetch()
    await flush()

    filter.value.filterId = 'other'
    const secondPromise = fetch()
    await flush()
    expect(pending[0].request.signal.aborted).toBe(true)

    pending[0].respond(locationResponse)
    await firstPromise
    expect(geojson.value.features).toEqual([])
    expect(loading.value).toBe(true)
    expect(fetch()).toBe(secondPromise)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const currentResponse = { type: 'FeatureCollection', features: [] }
    pending[1].respond(currentResponse)
    await secondPromise
    expect(geojson.value).toEqual(currentResponse)
    expect(error.value).toBeNull()
  })

  it('does not let a stale response overwrite a completed newer request', async () => {
    fetchMock.mockImplementationOnce((request: Request) =>
      new Promise<Response>((resolve) => {
        pending.push({
          request,
          respond: (body) => resolve(new Response(JSON.stringify(body))),
        })
      }),
    )
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, geojson } = setup({ filter })
    const firstPromise = fetch()
    await flush()
    filter.value = { filterId: 'other' }
    const secondPromise = fetch()
    await flush()
    const currentResponse = { type: 'FeatureCollection', features: [] }
    pending[1].respond(currentResponse)
    await secondPromise

    pending[0].respond(locationResponse)
    await firstPromise
    expect(geojson.value).toEqual(currentResponse)
  })

  it('permits retry after failure', async () => {
    const { fetch, error, loading, refreshing, hasLoaded, hasAttempted } = setup()
    const firstPromise = fetch()
    await flush()
    pending[0].respond({}, 500)
    await expect(firstPromise).rejects.toThrow()

    const retryPromise = fetch()
    expect(loading.value).toBe(true)
    expect(refreshing.value).toBe(false)
    expect(hasLoaded.value).toBe(false)
    expect(hasAttempted.value).toBe(true)
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    pending[1].respond(locationResponse)
    await retryPromise
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(hasLoaded.value).toBe(true)
  })

  it('permits retry after a synchronous provider failure', async () => {
    vi.spyOn(PiWebserviceProvider.prototype, 'getLocations').mockImplementationOnce(() => {
      throw new Error('Synchronous failure')
    })
    const { fetch } = setup()
    await expect(fetch()).rejects.toThrow('Synchronous failure')

    const retryPromise = fetch()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    pending[0].respond(locationResponse)
    await retryPromise
  })

  it('permits retry after cancellation', async () => {
    const { fetch, cancel } = setup()
    const firstPromise = fetch()
    await flush()
    cancel()
    const retryPromise = fetch()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetch()).toBe(retryPromise)
    pending[1].respond(locationResponse)
    await Promise.all([firstPromise, retryPromise])
  })

  it('clears loaded data and cancels pending work for an undefined filter without fetching', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, locations, geojson, hasLoaded, loading, refreshing } = setup({ filter })
    const firstPromise = fetch()
    await flush()
    pending[0].respond(locationResponse)
    await firstPromise
    const refreshPromise = fetch()
    await flush()

    filter.value = undefined as unknown as LocationsFilter
    await refreshPromise
    await fetch()
    await flush()

    expect(pending[1].request.signal.aborted).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(locations.value).toEqual([])
    expect(geojson.value.features).toEqual([])
    expect(hasLoaded.value).toBe(false)
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(false)
  })

  it('does not fetch an initially undefined filter', async () => {
    const { fetch } = setup({
      filter: ref(undefined as unknown as LocationsFilter),
      refresh: { policies: [], immediate: true },
    })
    await fetch()
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches unchanged filters again for explicit refreshes after completion', async () => {
    const { fetch, requestRefresh, refreshing } = setup()
    const firstPromise = fetch()
    await flush()
    pending[0].respond(locationResponse)
    await firstPromise

    requestRefresh()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(refreshing.value).toBe(true)
    pending[1].respond(locationResponse)
    await flush()
    expect(refreshing.value).toBe(false)
  })

  it('retains queued policy refreshes for newer data', async () => {
    const systemTick = ref<Date>()
    const { fetch, requestRefresh, lastTriggerPolicy } = setup({
      refresh: { policies: ['onSystemTick'], systemTick, immediate: true },
    })
    await flush()
    systemTick.value = new Date()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    pending[0].respond(locationResponse)
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    pending[1].respond(locationResponse)
    await flush()
    expect(lastTriggerPolicy.value).toBe('onSystemTick')

    requestRefresh()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    pending[2].respond(locationResponse)
    await fetch()
  })

  it('does not share requests across instances', async () => {
    const first = setup()
    const second = setup()
    const promises = [first.fetch(), second.fetch()]
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    pending.forEach((request) => request.respond(locationResponse))
    await Promise.all(promises)
  })

  it('does not fetch while disabled', async () => {
    const enabled = ref(false)
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, loading, requestRefresh } = setup({ enabled, filter })

    await fetch()
    filter.value = { filterId: 'other' }
    requestRefresh()
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('aborts requests when its scope is disposed', async () => {
    const filter = ref<LocationsFilter>({ filterId: 'example' })
    const { fetch, scope, requestRefresh } = setup({ filter })
    const fetchPromise = fetch()
    await flush()
    const request = pending[0].request

    scope.stop()
    await fetchPromise

    expect(request.signal.aborted).toBe(true)
    filter.value = { filterId: 'other' }
    requestRefresh()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
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
