import { WMSProvider } from '@deltares/fews-wms-requests'
import {
  onScopeDispose,
  ref,
  shallowRef,
  type Ref,
} from 'vue'
import {
  type RefreshPolicy,
  useRefreshCoordinator,
} from '../useRefreshCoordinator/index.js'
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
  const loading = ref(false)
  const refreshing = ref(false)
  const error = shallowRef<Error | null>(null)
  const hasLoaded = ref(false)
  let requestId = 0
  let abortController: AbortController | null = null

  function cancel(): void {
    requestId++
    abortController?.abort()
    abortController = null
    loading.value = false
    refreshing.value = false
  }

  async function fetch(): Promise<void> {
    if (!enabled.value) {
      return
    }

    cancel()
    const currentRequestId = requestId
    const controller = new AbortController()
    abortController = controller
    loading.value = !hasLoaded.value
    refreshing.value = hasLoaded.value
    error.value = null

    try {
      const wmsProvider = createWmsProvider(
        webserviceContext,
        () => controller.signal,
      )
      const response = await wmsProvider.getCapabilities({})
      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      capabilities.value = response
      hasLoaded.value = true
    } catch (cause) {
      if (controller.signal.aborted || currentRequestId !== requestId) {
        return
      }

      const requestError =
        cause instanceof Error ? cause : new Error(String(cause))
      error.value = requestError
      hasLoaded.value = true
      throw requestError
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false
        refreshing.value = false
        abortController = null
      }
    }
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

  onScopeDispose(cancel, true)

  return {
    capabilities,
    loading,
    refreshing,
    error,
    hasLoaded,
    fetch,
    cancel,
    requestRefresh: refreshCoordinator.trigger,
    pauseRefresh: refreshCoordinator.pause,
    resumeRefresh: refreshCoordinator.resume,
    lastRefreshAt: refreshCoordinator.lastRefreshAt,
    lastTriggerPolicy: refreshCoordinator.lastTriggerPolicy,
  }
}