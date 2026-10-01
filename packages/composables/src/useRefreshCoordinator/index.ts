import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { onUnmounted, ref, watch, type Ref } from 'vue'
import { useHostRefreshContext } from '../useHostRefreshContext'

export type RefreshPolicy =
  'onSystemTick' | 'onInterval' | 'onVisibilityResume' | 'manual'

export interface UseRefreshCoordinatorOptions {
  /**
   * The policies that can trigger a refresh. Only policies included here
   * have any effect; e.g. `'onInterval'` must be included for `intervalMs`
   * to take effect.
   */
  policies: RefreshPolicy[]

  /**
   * The system-time synchronization tick, used by the `'onSystemTick'`
   * policy. A refresh is triggered whenever this ref's value changes.
   *
   * @default
   * When omitted, the host-provided system tick (from
   * `useHostRefreshContext()`) is used. This allows standalone applications
   * to provide their own system tick without requiring microfrontend
   * developers to configure anything.
   */
  systemTick?: Ref<Date | undefined>

  /**
   * The interval, in milliseconds, between automatic refreshes when
   * `'onInterval'` is included in `policies`.
   *
   * @default 1000
   */
  intervalMs?: number

  /**
   * Whether to invoke the callback immediately when the coordinator is
   * created.
   *
   * @default false
   */
  immediateCallback?: boolean

  /**
   * A reactive flag controlling whether automatic refreshes are currently
   * enabled. When `false`, all triggers are ignored until it becomes `true`
   * again.
   *
   * @default ref(true)
   */
  enabled?: Ref<boolean>
}

export interface RefreshCoordinator {
  /**
   * Whether automatic refreshes are currently active.
   */
  isActive: Readonly<Ref<boolean>>

  /**
   * Pauses automatic refreshes.
   */
  pause: () => void

  /**
   * Resumes automatic refreshes.
   */
  resume: () => void

  /**
   * Requests a refresh.
   *
   * The refresh is ignored when the coordinator is paused or disabled.
   */
  trigger: (policy?: RefreshPolicy) => void

  /**
   * The time at which the most recent refresh completed successfully.
   */
  lastRefreshAt: Readonly<Ref<Date | undefined>>

  /**
   * The policy that caused the most recent refresh.
   */
  lastTriggerPolicy: Readonly<Ref<RefreshPolicy | undefined>>
}

/**
 * Coordinates automatic refreshes for data-fetching composables, driven by
 * one or more {@link RefreshPolicy} triggers: a shared system tick, a fixed
 * interval, document-visibility resume, or manual triggers.
 *
 * Only one refresh runs at a time: if `trigger()` is called while a refresh
 * is already in flight, a single refresh is queued to run immediately
 * afterwards.
 *
 * @param callback The function to invoke on each refresh. May be async;
 *   while it is pending, further triggers are coalesced into one pending
 *   refresh.
 * @param options Configuration for which policies trigger a refresh, and
 *   their parameters. See {@link UseRefreshCoordinatorOptions}.
 * @returns A {@link RefreshCoordinator} used to pause/resume automatic
 *   refreshes, trigger a refresh manually, and inspect the last refresh.
 *
 * @example
 * ```ts
 * import { useRefreshCoordinator } from '@deltares/fews-web-oc-composables'
 *
 * const coordinator = useRefreshCoordinator(
 *   async () => {
 *     await fetchLatestData()
 *   },
 *   {
 *     policies: ['onSystemTick', 'onInterval', 'onVisibilityResume'],
 *     intervalMs: 60_000,
 *     immediateCallback: true,
 *   },
 * )
 *
 * // Trigger a refresh manually, e.g. from a "Refresh now" button:
 * coordinator.trigger()
 *
 * // Temporarily stop automatic refreshes, e.g. while a dialog is open:
 * coordinator.pause()
 * coordinator.resume()
 * ```
 */
export function useRefreshCoordinator(
  callback: () => void | Promise<void>,
  options: UseRefreshCoordinatorOptions,
): RefreshCoordinator {
  const visibility = useDocumentVisibility()
  const policySet = new Set(options.policies)

  const isActive = ref(true)
  const enabled = options.enabled ?? ref(true)

  const lastRefreshAt = ref<Date>()
  const lastTriggerPolicy = ref<RefreshPolicy>()

  let intervalPausable: ReturnType<typeof useIntervalFn> | undefined

  let inFlight = false
  let hasPending = false
  let pendingTriggerPolicy: RefreshPolicy | undefined

  let systemTick = options.systemTick

  if (policySet.has('onSystemTick') && !systemTick) {
    systemTick = useHostRefreshContext().systemTick
  }

  async function invoke(
    triggerPolicy: RefreshPolicy = 'manual',
  ): Promise<void> {
    if (!isActive.value) return

    if (!enabled.value) return

    if (policySet.has('onVisibilityResume') && visibility.value !== 'visible') {
      return
    }

    if (inFlight) {
      hasPending = true
      pendingTriggerPolicy = triggerPolicy
      return
    }

    inFlight = true

    try {
      await callback()

      lastRefreshAt.value = new Date()
      lastTriggerPolicy.value = triggerPolicy
    } finally {
      inFlight = false

      if (hasPending) {
        const nextTriggerPolicy = pendingTriggerPolicy ?? 'manual'

        hasPending = false
        pendingTriggerPolicy = undefined

        void invoke(nextTriggerPolicy)
      }
    }
  }

  const trigger = (policy: RefreshPolicy = 'manual'): void => {
    void invoke(policy)
  }

  const pause = (): void => {
    isActive.value = false
    intervalPausable?.pause()
  }

  const resume = (): void => {
    isActive.value = true
    intervalPausable?.resume()
  }

  if (policySet.has('onInterval')) {
    intervalPausable = useIntervalFn(
      () => trigger('onInterval'),
      options.intervalMs ?? 1000,
    )
  }

  if (policySet.has('onVisibilityResume')) {
    watch(visibility, (value) => {
      if (value === 'visible') {
        trigger('onVisibilityResume')
      }
    })
  }

  if (policySet.has('onSystemTick')) {
    if (!systemTick) {
      throw new Error(
        'useRefreshCoordinator: `systemTick` is required when ' +
          '`onSystemTick` is included in `policies` and no host ' +
          'refresh context has been provided.',
      )
    }

    watch(
      () => systemTick!.value?.getTime(),
      (newValue, oldValue) => {
        if (newValue === undefined || newValue === oldValue) {
          return
        }

        trigger('onSystemTick')
      },
    )
  }

  if (options.immediateCallback) {
    trigger('manual')
  }

  onUnmounted(() => {
    pause()
  })

  return {
    isActive,
    pause,
    resume,
    trigger,
    lastRefreshAt,
    lastTriggerPolicy,
  }
}
