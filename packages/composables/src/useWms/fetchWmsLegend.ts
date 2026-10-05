import { WMSProvider } from '@deltares/fews-wms-requests'
import type { PiWebserviceOptions } from '../lib/requests/resolveWebserviceContext.js'
import { resolveWebserviceContext } from '../lib/requests/resolveWebserviceContext.js'
import { createWmsProvider } from './createWmsProvider.js'

type GetLegendGraphicResponse = Awaited<ReturnType<WMSProvider['getLegendGraphic']>>
type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>
type Layer = GetCapabilitiesResponse['layers'][number]
type Style = NonNullable<Layer['styles']>[number]

export interface FetchWmsLegendOptions {
  /** Name of the layer to load the legend for. */
  layerName: string

  /** Whether to render the legend using display units. */
  useDisplayUnits: boolean

  /** Optional `"min,max"` color scale range override. */
  colorScaleRange?: string

  /** Optional WMS style to render the legend with. */
  style?: Style

  /**
   * Optional webservice configuration for standalone usage. When omitted,
   * the host-provided webservice context is used.
   */
  webservice?: PiWebserviceOptions
}

/**
 * @alpha This API is not yet stable and may change in future versions.
 *
 * Fetches a WMS legend graphic once, as a plain `Promise`.
 *
 * Use this instead of {@link useWmsLegend} when a reactive, auto-reloading
 * result is not needed (e.g. for generating a one-off image for a report).
 *
 * @param options Request configuration. See {@link FetchWmsLegendOptions}.
 * @returns A promise resolving to the legend graphic response.
 *
 * @example
 * ```ts
 * import { fetchWmsLegend } from '@deltares/fews-web-oc-composables'
 *
 * const legendGraphic = await fetchWmsLegend({
 *   layerName: 'waterlevel',
 *   useDisplayUnits: true,
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 * })
 * ```
 * @group Other Functions
 */
export async function fetchWmsLegend(
  options: FetchWmsLegendOptions,
): Promise<GetLegendGraphicResponse> {
  const webserviceContext = resolveWebserviceContext(options.webservice)
  const wmsProvider = createWmsProvider(webserviceContext, () => undefined)

  try {
    return await wmsProvider.getLegendGraphic({
      layers: options.layerName,
      colorscalerange: options.colorScaleRange,
      useDisplayUnits: options.useDisplayUnits,
      style: options.style?.name,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}