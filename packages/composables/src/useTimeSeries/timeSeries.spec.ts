import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref, type EffectScope } from 'vue'
import type { TimeSeriesFilter } from '@deltares/fews-pi-requests'
import {
  usePiTimeSeries,
  type PiTimeSeriesRequest,
  type UsePiTimeSeriesOptions,
} from './index'

const baseUrl = 'https://example.localhost/fewswebservices'
const timeSeriesUrl = `${baseUrl}/rest/fewspiservice/v1/timeseries`

interface PendingRequest {
  url: string
  signal: AbortSignal
  respond: (body: unknown, status?: number) => void
}

let pending: PendingRequest[]
let fetchMock: ReturnType<typeof vi.fn>
let scopes: EffectScope[]

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

async function respondAll(status = 200): Promise<void> {
  const requests = pending
  pending = []
  for (const request of requests) {
    request.respond({ version: request.url }, status)
  }
  await flush()
}

function setup(
  options: Omit<UsePiTimeSeriesOptions, 'requests'> & {
    requests: UsePiTimeSeriesOptions['requests']
  },
) {
  const systemTick = options.refresh?.systemTick ?? ref<Date>()
  const scope = effectScope()
  scopes.push(scope)
  const result = scope.run(() =>
    usePiTimeSeries({
      webservice: { baseUrl },
      ...options,
      refresh: { policies: ['onSystemTick'], ...options.refresh, systemTick },
    }),
  )!
  return { ...result, scope, systemTick }
}

const requestA: PiTimeSeriesRequest = {
  key: 'a',
  relativeUrl: 'rest/fewspiservice/v1/timeseries?filterId=a',
}
const requestB: PiTimeSeriesRequest = {
  key: 'b',
  relativeUrl: 'rest/fewspiservice/v1/timeseries?filterId=b',
}

describe('usePiTimeSeries', () => {
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
            url: request.url,
            signal: request.signal,
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
    // useRefreshCoordinator registers onUnmounted outside a component instance.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    scopes.forEach((scope) => scope.stop())
    await flush()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches all requests immediately and exposes responses per key', async () => {
    const { responses, loading, entries } = setup({
      requests: [requestA, requestB],
    })
    await flush()

    expect(loading.value).toBe(true)
    expect(pending.map((r) => r.url)).toEqual([
      `${timeSeriesUrl}?filterId=a`,
      `${timeSeriesUrl}?filterId=b`,
    ])

    await respondAll()

    expect(loading.value).toBe(false)
    expect(responses.value).toEqual({
      a: { version: `${timeSeriesUrl}?filterId=a` },
      b: { version: `${timeSeriesUrl}?filterId=b` },
    })
    expect(entries.value.a.updatedAt).toBeInstanceOf(Date)
  })

  it('builds the URL for filter requests', async () => {
    setup({
      requests: [{ key: 'f', filter: { filterId: 'f' } as TimeSeriesFilter }],
    })
    await flush()

    const url = new URL(pending[0].url)
    expect(`${url.origin}${url.pathname}`).toBe(timeSeriesUrl)
    expect(url.searchParams.get('filterId')).toBe('f')
    expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
  })

  it('applies the query options to every request', async () => {
    setup({
      requests: [requestA, requestB],
      query: { startTime: new Date('2024-01-01T00:00:00Z'), onlyHeaders: true },
    })
    await flush()

    for (const request of pending) {
      const params = new URL(request.url).searchParams
      expect(params.get('startTime')).toBe('2024-01-01T00:00:00Z')
      expect(params.get('onlyHeaders')).toBe('true')
    }
  })

  it('sends one request for identical requests within one instance', async () => {
    const { responses } = setup({
      requests: [requestA, { ...requestA, key: 'a2' }],
    })
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    await respondAll()

    expect(Object.keys(responses.value)).toEqual(['a', 'a2'])
  })

  it('sends one request for identical requests of multiple instances on the same tick', async () => {
    const systemTick = ref<Date>()
    const first = setup({ requests: [requestA], refresh: { systemTick } })
    const second = setup({
      requests: [requestA, requestB],
      refresh: { systemTick },
    })
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    await respondAll()

    systemTick.value = new Date('2024-01-01T00:00:00Z')
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(4)
    await respondAll()

    expect(first.responses.value.a).toBeDefined()
    expect(second.responses.value.a).toBe(first.responses.value.a)
    expect(second.responses.value.b).toBeDefined()
  })

  it('keeps the previous response while refreshing on a system tick', async () => {
    const { entries, loading, refreshing, systemTick } = setup({
      requests: [requestA],
    })
    await flush()
    await respondAll()
    const previous = entries.value.a.response

    systemTick.value = new Date('2024-01-01T00:00:00Z')
    await flush()

    expect(pending).toHaveLength(1)
    expect(loading.value).toBe(false)
    expect(refreshing.value).toBe(true)
    expect(entries.value.a.response).toBe(previous)

    await respondAll()

    expect(refreshing.value).toBe(false)
    expect(entries.value.a.response).not.toBe(previous)
  })

  it('records errors per key without affecting other keys', async () => {
    const { errors, responses } = setup({ requests: [requestA, requestB] })
    await flush()

    pending[0].respond({}, 500)
    pending[1].respond({ version: 'ok' })
    pending = []
    await flush()

    expect(errors.value.a).toBeInstanceOf(Error)
    expect(errors.value.b).toBeUndefined()
    expect(responses.value.b).toEqual({ version: 'ok' })
  })

  it('refetches when the requests change and removes stale keys', async () => {
    const requests = ref<PiTimeSeriesRequest[]>([requestA])
    const { entries } = setup({ requests })
    await flush()
    const firstRequest = pending[0]

    requests.value = [requestB]
    await flush()

    expect(firstRequest.signal.aborted).toBe(true)
    expect(pending[pending.length - 1].url).toBe(`${timeSeriesUrl}?filterId=b`)

    pending = pending.filter((r) => !r.signal.aborted)
    await respondAll()

    expect(Object.keys(entries.value)).toEqual(['b'])
  })

  it('does not refetch when the requests change to equivalent requests', async () => {
    const requests = ref<PiTimeSeriesRequest[]>([requestA])
    setup({ requests })
    await flush()
    await respondAll()

    requests.value = [{ ...requestA }]
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not fetch while disabled and fetches once enabled', async () => {
    const enabled = ref(false)
    setup({ requests: [requestA], enabled })
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()

    enabled.value = true
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('cancels running requests when disabled', async () => {
    const enabled = ref(true)
    const { loading } = setup({ requests: [requestA], enabled })
    await flush()

    enabled.value = false
    await flush()

    expect(pending[0].signal.aborted).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('only fetches on request when immediate is false', async () => {
    const { requestRefresh } = setup({
      requests: [requestA],
      refresh: { immediate: false },
    })
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()

    requestRefresh()
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts a shared request only when all instances are disposed', async () => {
    const first = setup({ requests: [requestA] })
    const second = setup({ requests: [requestA] })
    await flush()

    expect(pending).toHaveLength(1)

    first.scope.stop()
    await flush()
    expect(pending[0].signal.aborted).toBe(false)

    second.scope.stop()
    await flush()
    expect(pending[0].signal.aborted).toBe(true)
  })

  it('passes the authorization headers to the request', async () => {
    setup({
      requests: [requestA],
      webservice: {
        baseUrl,
        getAuthorizationHeaders: async () =>
          new Headers({ Authorization: 'Bearer token' }),
      },
    })
    await flush()

    const request = fetchMock.mock.calls[0][0] as Request
    expect(request.headers.get('Authorization')).toBe('Bearer token')
  })
})
