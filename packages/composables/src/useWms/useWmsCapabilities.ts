import { WMSProvider } from '@deltares/fews-wms-requests'
import { ref, type Ref } from 'vue'
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

type GetCapabilitiesResponse = Awaited<ReturnType<WMSProvider['getCapabilities']>>

const DEFAULT_REFRESH_POLICIES: RefreshPolicy[] = []

export interface UseWmsCapabilitiesOptions extends UseWmsOptions {}

export interface UseWmsCapabilitiesReturn extends UseWmsRequestReturn {
  /** The full WMS `GetCapabilities` response. */
  capabilities: Readonly<Ref<GetCapabilitiesResponse | undefined>>
}

/**
 * @alpha This API is not yet stable and may change in future versions.
 *
 * Loads the full WMS `GetCapabilities` response for all layers and refreshes
 * it according to the configured refresh policies. Unlike
 * {@link useWmsLayerCapabilities}, it does not require a layer name.
 * By default, it fetches immediately but has no scheduled refresh policies.
 *
 * @param options Request configuration. See {@link UseWmsCapabilitiesOptions}.
 * @returns The capabilities and request state. See {@link UseWmsCapabilitiesReturn}.
 *
 * @example
 * ```ts
 * import { useWmsCapabilities } from '@deltares/fews-web-oc-composables'
 *
 * const { capabilities, loading, error } = useWmsCapabilities({
 *   webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
 *   refresh: { policies: ['onInterval'], intervalMs: 30_000 },
 * })
 * ```
 * @group Composables
 */
export function useWmsCapabilities(
  options: UseWmsCapabilitiesOptions,
): UseWmsCapabilitiesReturn {
  const enabled = options.enabled ?? ref(true)
  const webserviceContext = resolveWebserviceContext(options.webservice)
  const capabilities = ref<GetCapabilitiesResponse>()
  const request = createRequestRunner(enabled)

  async function fetch(): Promise<void> {
    if (!enabled.value) {
      return
    }

    await request.run(
      (signal) => {
        const wmsProvider = createWmsProvider(webserviceContext, () => signal)
        return wmsProvider.getCapabilities({})
      },
      (response) => {
        capabilities.value = response
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

  return {
    capabilities,
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