import { WMSProvider } from '@deltares/fews-wms-requests'
import { type MaybeRefOrGetter, ref, type Ref, toValue, watchEffect } from 'vue'

type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>
type GetLegendGraphicResponse = Awaited<ReturnType<WMSProvider['getLegendGraphic']>>
type GetCapabilitiesFilter = Parameters<WMSProvider['getCapabilities']>[0]
type Layer = GetCapabilitiesResponse['layers'][number]
type Style = NonNullable<Layer['styles']>[number]

export interface UseWmsReturn {
  /**
   * The WMS capabilities of the requested layer, or `undefined` when no
   * layer is selected, or the request has not resolved yet.
   */
  layerCapabilities: Ref<Layer | undefined>

  /**
   * The available time values for the layer, restricted to the layer's
   * `firstValueTime`/`lastValueTime` range (if present), or `undefined`
   * when no layer is selected.
   */
  times: Ref<Date[] | undefined>

  /**
   * The full WMS `GetCapabilities` response, or `undefined` when no layer
   * is selected, or the request has not resolved yet.
   */
  capabilities: Ref<GetCapabilitiesResponse | undefined>

  /**
   * Reloads the capabilities and times. Called automatically whenever
   * `baseUrl`, `layerName`, or `filter` change.
   */
  loadCapabilities: () => void
}

/**
 * @experimental This API is not yet stable and may change in future versions.
 *
 * Loads WMS `GetCapabilities` for a layer, and derives the layer's
 * capabilities and available time values from the response.
 *
 * Reactively reloads whenever `baseUrl`, `layerName`, or `filter` change. On
 * request failure, `capabilities` and `layerCapabilities` are reset to
 * `undefined` and the error is logged to the console.
 *
 * @param baseUrl The FEWS webservices base URL (ref, getter, or plain
 *   value). The WMS endpoint used is `${baseUrl}/wms`.
 * @param layerName The name of the layer to load (ref, getter, or plain
 *   value). When `undefined`, `capabilities` and `layerCapabilities` are
 *   reset to `undefined` and no request is made.
 * @param filter Optional overrides for the `GetCapabilities` request.
 *
 *   Defaults applied when not overridden:
 *   - `importFromExternalDataSource`: `false`
 *   - `onlyHeaders`: `false`
 *   - `forecastCount`: `1`
 * @returns See {@link UseWmsReturn}.
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { useWmsLayerCapabilities } from '@deltares/fews-web-oc-composables'
 *
 * const baseUrl = ref('https://example.localhost/data')
 * const layerName = ref('waterlevel')
 *
 * const { capabilities, layerCapabilities, times } =
 *   useWmsLayerCapabilities(baseUrl, layerName)
 * ```
 * @group Composables
 */
export function useWmsLayerCapabilities(
  baseUrl: MaybeRefOrGetter<string>,
  layerName: MaybeRefOrGetter<string | undefined>,
  filter?: MaybeRefOrGetter<Partial<GetCapabilitiesFilter>>
): UseWmsReturn {

  const times = ref<Date[]>()
  const layerCapabilities = ref<Layer>()
  const capabilities = ref<GetCapabilitiesResponse>()

  async function loadLayer(): Promise<void> {
    const _baseUrl = toValue(baseUrl)
    const _layers = toValue(layerName)
    const _filter = toValue(filter)

    if (_layers === undefined) {
      capabilities.value = undefined
      layerCapabilities.value = undefined
      return
    }

    try {
      const wmsUrl = `${_baseUrl}/wms`
      const wmsProvider = new WMSProvider(wmsUrl)
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

/**
 * @experimental This API is not yet stable and may change in future versions.
 *
 * Loads a WMS legend graphic for a layer, reactively reloading whenever any
 * of the arguments change.
 *
 * @param baseUrl The FEWS webservices base URL (ref, getter, or plain
 *   value). The WMS endpoint used is `${baseUrl}/wms`.
 * @param layerName The name of the layer to load the legend for (ref,
 *   getter, or plain value). When `undefined`, the returned ref is reset to
 *   `undefined` and no request is made.
 * @param useDisplayUnits Whether to render the legend using the layer's
 *   display units instead of its base units.
 * @param colorScaleRange Optional `"min,max"` string overriding the color
 *   scale range used to render the legend. When omitted, the layer's
 *   default color scale range is used.
 * @param style Optional WMS style (as returned in a layer's `styles`) to
 *   render the legend with. When omitted, the layer's default style is used.
 * @returns A ref with the legend graphic response, or `undefined` when no
 *   layer is selected or the request has not resolved yet.
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue'
 * import { useWmsLegend } from '@deltares/fews-web-oc-composables'
 *
 * const baseUrl = ref('https://example.localhost/data')
 * const layerName = ref('waterlevel')
 *
 * const legendGraphic = useWmsLegend(baseUrl, layerName, true)
 * ```
 * @group Composables
 */
export function useWmsLegend(
  baseUrl: MaybeRefOrGetter<string>,
  layerName: MaybeRefOrGetter<string | undefined>,
  useDisplayUnits: MaybeRefOrGetter<boolean>,
  colorScaleRange?: MaybeRefOrGetter<string | undefined>,
  style?: MaybeRefOrGetter<Style>
): Ref<GetLegendGraphicResponse | undefined> {
  const legendGraphic = ref<GetLegendGraphicResponse>()

  async function loadLegend(): Promise<void> {
    const _baseUrl = toValue(baseUrl)
    const _layers = toValue(layerName)
    const _useDisplayUnits = toValue(useDisplayUnits)
    const _colorScaleRange = toValue(colorScaleRange)
    const _style = toValue(style)

    if (_layers === undefined) {
      legendGraphic.value = undefined
      return
    }

    legendGraphic.value = await fetchWmsLegend(
      _baseUrl,
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

/**
 * @experimental This API is not yet stable and may change in future versions.
 *
 * Fetches a WMS legend graphic for a layer once, as a plain `Promise`.
 *
 * Use this instead of {@link useWmsLegend} when a reactive, auto-reloading
 * result is not needed (e.g. for generating a one-off image for a report).
 *
 * @param baseUrl The FEWS webservices base URL. The WMS endpoint used is
 *   `${baseUrl}/wms`.
 * @param layerName The name of the layer to load the legend for.
 * @param useDisplayUnits Whether to render the legend using the layer's
 *   display units instead of its base units.
 * @param colorScaleRange Optional `"min,max"` string overriding the color
 *   scale range used to render the legend. When omitted, the layer's
 *   default color scale range is used.
 * @param style Optional WMS style (as returned in a layer's `styles`) to
 *   render the legend with. When omitted, the layer's default style is used.
 * @returns A promise resolving to the legend graphic response.
 *
 * @example
 * ```ts
 * import { fetchWmsLegend } from '@deltares/fews-web-oc-composables'
 *
 * const legendGraphic = await fetchWmsLegend(
 *   'https://example.localhost/data',
 *   'waterlevel',
 *   true,
 * )
 * ```
 * @group Other Functions
 */
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

/**
 * @experimental This API is not yet stable and may change in future versions.
 *
 * Loads the full WMS `GetCapabilities` response for all layers once, on
 * creation. Unlike {@link useWmsLayerCapabilities}, this is not reactive:
 * it is fetched a single time using the `baseUrl` passed in.
 *
 * @param baseUrl The FEWS webservices base URL. The WMS endpoint used is
 *   `${baseUrl}/wms`.
 * @returns A ref with the `GetCapabilities` response, or `undefined` until
 *   the request resolves (or if it fails; the error is logged to console).
 *
 * @example
 * ```ts
 * import { useWmsCapilities } from '@deltares/fews-web-oc-composables'
 *
 * const capabilities = useWmsCapilities('https://example.localhost/data')
 * ```
 * @group Composables
 */
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
