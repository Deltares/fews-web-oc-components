import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWmsProvider } from './createWmsProvider.js'

type TransformRequest = (request: Request) => Promise<Request>

const mocks = vi.hoisted(() => ({
  constructors: [] as Array<{
    baseUrl: string
    transformRequestFn?: TransformRequest
  }>,
}))

vi.mock('@deltares/fews-wms-requests', () => ({
  WMSProvider: class {
    constructor(
      baseUrl: string,
      options?: { transformRequestFn?: TransformRequest },
    ) {
      mocks.constructors.push({
        baseUrl,
        transformRequestFn: options?.transformRequestFn,
      })
    }
  },
}))

describe('createWmsProvider', () => {
  beforeEach(() => {
    mocks.constructors.length = 0
  })

  it('configures authorization headers and the active abort signal', async () => {
    const abortController = new AbortController()
    createWmsProvider(
      {
        baseUrl: 'https://example.localhost/fewswebservices',
        getAuthorizationHeaders: async () =>
          new Headers({ Authorization: 'Bearer example-token' }),
      },
      () => abortController.signal,
    )

    const providerOptions = mocks.constructors[0]
    expect(providerOptions.baseUrl).toBe(
      'https://example.localhost/fewswebservices/wms',
    )
    expect(providerOptions.transformRequestFn).toBeDefined()

    const transformRequestFn = providerOptions.transformRequestFn
    if (!transformRequestFn) {
      throw new Error('Expected WMS provider request transform')
    }

    const request = await transformRequestFn(
      new Request('https://example.localhost/fewswebservices/wms'),
    )

    expect(request.headers.get('Authorization')).toBe('Bearer example-token')
    expect(request.signal.aborted).toBe(false)

    abortController.abort()
    expect(request.signal.aborted).toBe(true)
  })
})
