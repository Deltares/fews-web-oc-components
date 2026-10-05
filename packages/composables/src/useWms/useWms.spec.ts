import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { provideHostWebserviceContext } from '../shared/hostWebserviceContext.js'
import { fetchWmsLegend } from './fetchWmsLegend.js'
import { useWmsCapabilities } from './useWmsCapabilities.js'
import { useWmsLayerCapabilities } from './useWmsLayerCapabilities.js'
import { useWmsLegend } from './useWmsLegend.js'

const mocks = vi.hoisted(() => ({
  getCapabilities: vi.fn(),
  getLegendGraphic: vi.fn(),
  providerUrls: [] as string[],
}))

vi.mock('@deltares/fews-wms-requests', () => ({
  WMSProvider: class {
    constructor(url: string) {
      mocks.providerUrls.push(url)
    }

    getCapabilities(filter: unknown) {
      return mocks.getCapabilities(filter)
    }

    getLegendGraphic(filter: unknown) {
      return mocks.getLegendGraphic(filter)
    }
  },
}))

const webservice = { baseUrl: 'https://example.localhost/fewswebservices' }
const refresh = { policies: [], immediate: false }
const capabilitiesResponse = {
  layers: [
    {
      name: 'waterlevel',
      times: ['2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z'],
      firstValueTime: '2025-01-01T00:00:00Z',
      lastValueTime: '2025-01-02T00:00:00Z',
    },
  ],
}

let scopes: EffectScope[]

function inScope<T>(callback: () => T): T {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(callback)!
}

describe('useWms composables', () => {
  beforeEach(() => {
    scopes = []
    mocks.getCapabilities.mockReset()
    mocks.getLegendGraphic.mockReset()
    mocks.providerUrls.length = 0
  })

  afterEach(() => {
    scopes.forEach((scope) => scope.stop())
    provideHostWebserviceContext({
      getBaseUrl: () => webservice.baseUrl,
      getAuthorizationHeaders: async () => new Headers(),
    })
  })

  it('loads layer capabilities and exposes request state', async () => {
    mocks.getCapabilities.mockResolvedValue(capabilitiesResponse)
    const result = inScope(() =>
      useWmsLayerCapabilities({
        layerName: ref('waterlevel'),
        webservice,
        refresh,
      }),
    )

    const fetchPromise = result.fetch()
    expect(result.loading.value).toBe(true)
    await fetchPromise

    expect(mocks.getCapabilities).toHaveBeenCalledWith({
      layers: 'waterlevel',
      importFromExternalDataSource: false,
      onlyHeaders: false,
      forecastCount: 1,
    })
    expect(result.capabilities.value).toEqual(capabilitiesResponse)
    expect(result.layerCapabilities.value?.name).toBe('waterlevel')
    expect(result.times.value?.map((date) => date.toISOString())).toEqual([
      '2025-01-01T00:00:00.000Z',
      '2025-01-02T00:00:00.000Z',
    ])
    expect(result.hasLoaded.value).toBe(true)
    expect(result.hasAttempted.value).toBe(true)
    expect(result.loading.value).toBe(false)
  })

  it('reloads layer capabilities when reactive options change', async () => {
    mocks.getCapabilities.mockResolvedValue(capabilitiesResponse)
    const layerName = ref('waterlevel')
    const result = inScope(() =>
      useWmsLayerCapabilities({ layerName, webservice, refresh }),
    )

    layerName.value = 'rainfall'
    expect(result.capabilities.value).toBeUndefined()
    expect(result.hasLoaded.value).toBe(false)
    expect(result.hasAttempted.value).toBe(false)
    await nextTick()
    await vi.waitFor(() => {
      expect(mocks.getCapabilities).toHaveBeenCalledTimes(1)
    })

    expect(mocks.getCapabilities).toHaveBeenCalledWith(
      expect.objectContaining({ layers: 'rainfall' }),
    )
  })

  it('loads a legend and exposes request state', async () => {
    const legendResponse = { image: 'legend-data' }
    let resolveNextLegend: (response: unknown) => void = () => {}
    mocks.getLegendGraphic
      .mockResolvedValueOnce(legendResponse)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextLegend = resolve
          }),
      )
    const layerName = ref('waterlevel')
    const result = inScope(() =>
      useWmsLegend({
        layerName,
        useDisplayUnits: true,
        colorScaleRange: '0,10',
        webservice,
        refresh,
      }),
    )

    await result.fetch()

    expect(mocks.getLegendGraphic).toHaveBeenCalledWith({
      layers: 'waterlevel',
      colorscalerange: '0,10',
      useDisplayUnits: true,
      style: undefined,
    })
    expect(result.legendGraphic.value).toEqual(legendResponse)
    expect(result.hasLoaded.value).toBe(true)
    expect(result.error.value).toBeNull()

    layerName.value = 'rainfall'
    await nextTick()
    expect(result.legendGraphic.value).toBeUndefined()
    expect(result.hasLoaded.value).toBe(false)
    expect(result.hasAttempted.value).toBe(false)
    resolveNextLegend({ image: 'new-legend-data' })
    await vi.waitFor(() => {
      expect(mocks.getLegendGraphic).toHaveBeenCalledTimes(2)
    })
    expect(mocks.getLegendGraphic).toHaveBeenLastCalledWith(
      expect.objectContaining({ layers: 'rainfall' }),
    )
  })

  it('fetches a legend with the options-object webservice configuration', async () => {
    const legendResponse = { image: 'legend-data' }
    mocks.getLegendGraphic.mockResolvedValue(legendResponse)

    await expect(
      fetchWmsLegend({
        layerName: 'waterlevel',
        useDisplayUnits: true,
        colorScaleRange: '0,10',
        webservice,
      }),
    ).resolves.toEqual(legendResponse)

    expect(mocks.providerUrls).toContain(`${webservice.baseUrl}/wms`)
    expect(mocks.getLegendGraphic).toHaveBeenCalledWith({
      layers: 'waterlevel',
      colorscalerange: '0,10',
      useDisplayUnits: true,
      style: undefined,
    })
  })

  it('uses the host webservice context when fetchWmsLegend omits webservice', async () => {
    const hostBaseUrl = 'https://host.example/fewswebservices'
    provideHostWebserviceContext({
      getBaseUrl: () => hostBaseUrl,
      getAuthorizationHeaders: async () => new Headers(),
    })
    mocks.getLegendGraphic.mockResolvedValue({ image: 'legend-data' })

    await fetchWmsLegend({
      layerName: 'waterlevel',
      useDisplayUnits: true,
    })

    expect(mocks.providerUrls).toContain(`${hostBaseUrl}/wms`)
  })

  it('loads all capabilities and exposes request state', async () => {
    mocks.getCapabilities.mockResolvedValue(capabilitiesResponse)
    const result = inScope(() =>
      useWmsCapabilities({ webservice, refresh }),
    )

    await result.fetch()

    expect(mocks.getCapabilities).toHaveBeenCalledWith({})
    expect(result.capabilities.value).toEqual(capabilitiesResponse)
    expect(result.hasLoaded.value).toBe(true)
    expect(result.hasAttempted.value).toBe(true)
    expect(result.error.value).toBeNull()
  })

  it('does not request data while disabled', async () => {
    const enabled = ref(false)
    const results = inScope(() => [
      useWmsLayerCapabilities({
        layerName: ref('waterlevel'),
        enabled,
        webservice,
        refresh,
      }),
      useWmsLegend({
        layerName: ref('waterlevel'),
        useDisplayUnits: true,
        enabled,
        webservice,
        refresh,
      }),
      useWmsCapabilities({ enabled, webservice, refresh }),
    ])

    await Promise.all(results.map((result) => result.fetch()))

    expect(mocks.getCapabilities).not.toHaveBeenCalled()
    expect(mocks.getLegendGraphic).not.toHaveBeenCalled()
    expect(results.every((result) => !result.loading.value)).toBe(true)
  })

  it('does not request layer data when no WMS layer is selected', async () => {
    const results = inScope(() => [
      useWmsLayerCapabilities({
        layerName: ref<string | undefined>(undefined),
        webservice,
        refresh,
      }),
      useWmsLegend({
        layerName: ref<string | undefined>(undefined),
        useDisplayUnits: true,
        webservice,
        refresh,
      }),
    ])

    await Promise.all(results.map((result) => result.fetch()))

    expect(mocks.getCapabilities).not.toHaveBeenCalled()
    expect(mocks.getLegendGraphic).not.toHaveBeenCalled()
    expect(results.every((result) => !result.hasLoaded.value)).toBe(true)
  })

  it('exposes request errors and rethrows them', async () => {
    const requestError = new Error('WMS request failed')
    mocks.getCapabilities.mockRejectedValue(requestError)
    const result = inScope(() =>
      useWmsCapabilities({ webservice, refresh }),
    )

    await expect(result.fetch()).rejects.toBe(requestError)

    expect(result.error.value).toBe(requestError)
    expect(result.hasLoaded.value).toBe(false)
    expect(result.hasAttempted.value).toBe(true)
    expect(result.loading.value).toBe(false)
  })

  it('retains successful layer capabilities when a same-input refresh fails', async () => {
    mocks.getCapabilities
      .mockResolvedValueOnce(capabilitiesResponse)
      .mockRejectedValueOnce(new Error('WMS refresh failed'))
    const result = inScope(() =>
      useWmsLayerCapabilities({
        layerName: ref('waterlevel'),
        webservice,
        refresh,
      }),
    )

    await result.fetch()
    await expect(result.fetch()).rejects.toThrow('WMS refresh failed')

    expect(result.capabilities.value).toEqual(capabilitiesResponse)
    expect(result.layerCapabilities.value?.name).toBe('waterlevel')
    expect(result.hasLoaded.value).toBe(true)
    expect(result.hasAttempted.value).toBe(true)
    expect(result.error.value).toEqual(new Error('WMS refresh failed'))
  })
})