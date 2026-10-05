import {
  type MaybeRefOrGetter,
  ref,
  type Ref,
  toValue,
  watch,
} from 'vue'
import { WMSProvider } from '@deltares/fews-wms-requests'
import {
  type RefreshPolicy,
  useRefreshCoordinator,
} from '../useRefreshCoordinator/index.js'
import { createRequestRunner } from '../lib/requests/createRequestRunner.js'
import { resolveWebserviceContext } from '../lib/requests/resolveWebserviceContext.js'
import {
  DEFAULT_WMS_REFRESH_INTERVAL_MS,
  type UseWmsOptions,
  type UseWmsRequestReturn,
} from './options.js'
import { createWmsProvider } from './createWmsProvider.js'

type GetLegendGraphicResponse = Awaited<ReturnType<WMSProvider['getLegendGraphic']>>
type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>
type Layer = GetCapabilitiesResponse['layers'][number]
type Style = NonNullable<Layer['styles']>[number]

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = []

export interface UseWmsLegendOptions extends UseWmsOptions {
  /** Name of the layer to load the legend for. */
  layerName: MaybeRefOrGetter<string | undefined>

  /** Whether to render the legend using display units. */
  useDisplayUnits: MaybeRefOrGetter<boolean>

  /** Optional `"min,max"` color scale range override. */
  colorScaleRange?: MaybeRefOrGetter<string>

  /** Optional WMS style to render the legend with. */
  style?: MaybeRefOrGetter<Style>
}

export interface UseWmsLegendReturn extends UseWmsRequestReturn {
  /** The loaded WMS legend graphic. */
  legendGraphic: Readonly<Ref<GetLegendGraphicResponse | undefined>>
}

/**
 * @alpha This API is not yet stable and may change in future versions.
 *
 * Loads a WMS legend graphic for a layer, reactively reloading when legend
 * options change and supporting automatic refresh through `refresh`.
 * Clears the previous graphic when those options change and preserves the
 * last successful graphic when a refresh for the same options fails.
 * By default, no scheduled refresh policies are enabled.
 *
 * @param options Request configuration. See {@link UseWmsLegendOptions}.
 * @returns The legend graphic and request state. See {@link UseWmsLegendReturn}.
 *
 * @example
 * ```ts
 * import { ref } from 'vue'
 * import { useWmsLegend } from '@deltares/fews-web-oc-composables'
 *
 * const options = {
 *   layerName: ref('waterlevel'),
 *   useDisplayUnits: true,
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 *   refresh: { policies: ['onInterval'], intervalMs: 30_000 },
 * }
 *
 * const { legendGraphic, loading, error } = useWmsLegend(options)
 * ```
 * @group Composables
 */
export function useWmsLegend(
  options: UseWmsLegendOptions
): UseWmsLegendReturn {
  const enabled = options.enabled ?? ref(true)
  const webserviceContext = resolveWebserviceContext(options.webservice)
  const legendGraphic = ref<GetLegendGraphicResponse>()
  const request = createRequestRunner(enabled)

  async function fetch(): Promise<void> {
    if (!enabled.value) {
      return
    }

    const layerName = toValue(options.layerName)
    const useDisplayUnits = toValue(options.useDisplayUnits)
    const colorScaleRange = toValue(options.colorScaleRange)
    const style = toValue(options.style)

    if (layerName === undefined) {
      request.reset()
      legendGraphic.value = undefined
      return
    }

    await request.run(
      (signal) => {
        const wmsProvider = createWmsProvider(webserviceContext, () => signal)
        return wmsProvider.getLegendGraphic({
          layers: layerName,
          colorscalerange: colorScaleRange,
          useDisplayUnits,
          style: style?.name,
        })
      },
      (response) => {
        legendGraphic.value = response
      },
    )
  }

  const {
    policies = DEFAULT_REFRESH_POLICIES,
    intervalMs = DEFAULT_WMS_REFRESH_INTERVAL_MS,
    immediate = true,
    systemTick,
  } = options.refresh ?? {}
  const refreshCoordinator = useRefreshCoordinator(fetch, {
    policies,
    intervalMs,
    immediateCallback: immediate,
    enabled,
    systemTick,
  })

  watch(
    () => [
      toValue(options.layerName),
      toValue(options.useDisplayUnits),
      toValue(options.colorScaleRange),
      toValue(options.style),
    ],
    () => {
      request.reset()
      legendGraphic.value = undefined
      refreshCoordinator.trigger()
    },
    { deep: true },
  )

  return {
    legendGraphic,
    loading: request.loading,
    refreshing: request.refreshing,
    error: request.error,
    hasLoaded: request.hasLoaded,
    hasAttempted: request.hasAttempted,
    fetch,
    cancel: request.cancel,
    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,
    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}