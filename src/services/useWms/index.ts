import {
  type GetCapabilitiesResponse,
  type GetLegendGraphicResponse,
  type Layer,
  WMSProvider,
  type Style,
  type GetCapabilitiesFilter
} from '@deltares/fews-wms-requests'
import { type MaybeRefOrGetter, ref, type Ref, toValue, watchEffect } from 'vue'

export interface UseWmsReturn {
  layerCapabilities: Ref<Layer | undefined>
  times: Ref<Date[] | undefined>
  capabilities: Ref<GetCapabilitiesResponse | undefined>
  loadCapabilities: () => void
}

export function useWmsLayerCapabilities(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string | undefined>,
  filter?: MaybeRefOrGetter<Partial<GetCapabilitiesFilter>>
): UseWmsReturn {
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl)
  const times = ref<Date[]>()
  const layerCapabilities = ref<Layer>()
  const capabilities = ref<GetCapabilitiesResponse>()

  async function loadLayer(): Promise<void> {
    const _layers = toValue(layerName)
    const _filter = toValue(filter)

    if (_layers === undefined) {
      capabilities.value = undefined
      layerCapabilities.value = undefined
      return
    }

    try {
      capabilities.value = await wmsProvider.getCapabilities({
        layers: _layers,
        importFromExternalDataSource: false,
        onlyHeaders: false,
        forecastCount: 1,
        ..._filter
      })
      if (capabilities.value?.layers?.length > 0) {
        layerCapabilities.value =
          capabilities.value.layers.find((l) => l.name === _layers) ?? capabilities.value.layers[0]
      }
    } catch (error) {
      capabilities.value = undefined
      layerCapabilities.value = undefined
      console.error(error)
    }
  }

  function loadTimes(): void {
    if (!layerCapabilities.value?.times) {
      times.value = undefined
      return
    }

    const dates = layerCapabilities.value.times.map((t) => new Date(t))
    let firstValueDate = dates[0]
    let lastValueDate = dates[dates.length - 1]
    if (layerCapabilities.value.firstValueTime) {
      firstValueDate = new Date(layerCapabilities.value.firstValueTime)
    }
    if (layerCapabilities.value.lastValueTime) {
      lastValueDate = new Date(layerCapabilities.value.lastValueTime)
    }

    const valueDates = dates.filter((d) => d >= firstValueDate && d <= lastValueDate)

    times.value = valueDates
  }
  function loadCapabilities() {
    loadLayer().then(() => {
      loadTimes()
    })
  }
  watchEffect(loadCapabilities)
  return { layerCapabilities, times, capabilities, loadCapabilities }
}

export function useWmsLegend(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
  useDisplayUnits: MaybeRefOrGetter<boolean>,
  colorScaleRange?: MaybeRefOrGetter<string | undefined>,
  style?: MaybeRefOrGetter<Style>
): Ref<GetLegendGraphicResponse | undefined> {
  const legendGraphic = ref<GetLegendGraphicResponse>()

  async function loadLegend(): Promise<void> {
    const _layers = toValue(layerName)
    const _useDisplayUnits = toValue(useDisplayUnits)
    const _colorScaleRange = toValue(colorScaleRange)
    const _style = toValue(style)

    if (_layers === undefined) {
      legendGraphic.value = undefined
      return
    }

    legendGraphic.value = await fetchWmsLegend(
      baseUrl,
      _layers,
      _useDisplayUnits,
      _colorScaleRange,
      _style
    )
  }

  watchEffect(() => {
    loadLegend()
  })
  return legendGraphic
}

export function fetchWmsLegend(
  baseUrl: string,
  layerName: string,
  useDisplayUnits: boolean,
  colorScaleRange?: string,
  style?: Style
): Promise<GetLegendGraphicResponse> {
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl)

  try {
    return wmsProvider.getLegendGraphic({
      layers: layerName,
      colorscalerange: colorScaleRange,
      useDisplayUnits: useDisplayUnits,
      style: style?.name
    })
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

export function useWmsCapilities(baseUrl: string): Ref<GetCapabilitiesResponse | undefined> {
  const capabilities = ref<GetCapabilitiesResponse>()
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl)

  async function loadCapabilities(): Promise<void> {
    try {
      capabilities.value = await wmsProvider.getCapabilities({})
    } catch (error) {
      console.error(error)
    }
  }

  loadCapabilities()
  return capabilities
}
