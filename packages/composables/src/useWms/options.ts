import type { Ref } from 'vue'
import type { PiWebserviceOptions } from '../lib/requests/resolveWebserviceContext.js'
import type { RefreshPolicy } from '../useRefreshCoordinator/index.js'

export const DEFAULT_WMS_REFRESH_INTERVAL_MS = 300_000

export interface UseWmsRefreshOptions {
  /**
  * Policies that trigger a scheduled automatic refresh. The default varies
  * by composable.
   */
  policies?: RefreshPolicy[]

  /**
   * Interval between automatic refreshes when 'onInterval' is enabled.
   *
   * @default 300000 (5 minutes)
   */
  intervalMs?: number

  /**
   * The system-time synchronization signal used by the `onSystemTick`
   * refresh policy. When omitted, the host-provided system tick is used.
   */
  systemTick?: Ref<Date | undefined>

  /**
   * Whether to fetch immediately when the composable is created.
   *
   * @default true
   */
  immediate?: boolean
}

export interface UseWmsOptions {
  /**
   * Controls whether requests and automatic refreshes are enabled.
   *
   * @default ref(true)
   */
  enabled?: Ref<boolean>

  /**
   * Optional webservice configuration for standalone usage. When omitted,
   * the host-provided webservice context is used.
   */
  webservice?: PiWebserviceOptions

  /** Configuration for automatic request refreshing. */
  refresh?: UseWmsRefreshOptions
}

export interface UseWmsRequestReturn {
  /** Whether the initial request is in progress. */
  loading: Readonly<Ref<boolean>>

  /** Whether a subsequent request is in progress. */
  refreshing: Readonly<Ref<boolean>>

  /** Error from the most recent request, or null when there is no error. */
  error: Readonly<Ref<Error | null>>

  /** Whether a successful response is available for the current inputs. */
  hasLoaded: Readonly<Ref<boolean>>

  /**
   * Whether a request has completed for the current inputs, successfully or
   * not.
   */
  hasAttempted: Readonly<Ref<boolean>>

  /** Fetches the requested WMS data immediately. */
  fetch: () => Promise<void>

  /** Cancels the currently running request, if any. */
  cancel: () => void

  /** Requests a refresh through the refresh coordinator. */
  requestRefresh: () => void

  /** Pauses automatic refreshes. */
  pauseRefresh: () => void

  /** Resumes automatic refreshes. */
  resumeRefresh: () => void

  /** Time at which the most recent refresh completed successfully. */
  lastRefreshAt: Readonly<Ref<Date | undefined>>

  /** Policy that caused the most recent refresh. */
  lastTriggerPolicy: Readonly<Ref<RefreshPolicy | undefined>>
}