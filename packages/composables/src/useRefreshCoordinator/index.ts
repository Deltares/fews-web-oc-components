import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { onUnmounted, ref, watch, type Ref } from 'vue'
import { useHostRefreshContext } from '../useHostRefreshContext'

export type RefreshPolicy =
  'onSystemTick' | 'onInterval' | 'onVisibilityResume' | 'manual'

export interface UseRefreshCoordinatorOptions {
  /**
   * The policies that can trigger a refresh.
   */
  policies: RefreshPolicy[]

  /**
   * The system-time synchronization tick.
   *
   * When omitted, the host-provided system tick is used.
   * This allows standalone applications to provide their own
   * system tick without requiring microfrontend developers to
   * configure anything.
   */
  systemTick?: Ref<Date | undefined>

  /**
   * The interval between automatic refreshes.
   *
   * Defaults to 1000 ms.
   */
  intervalMs?: number

  /**
   * Whether to invoke the callback immediately.
   *
   * Defaults to false.
   */
  immediateCallback?: boolean

  /**
   * Whether automatic refreshes are currently enabled.
   *
   * Defaults to true.
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
