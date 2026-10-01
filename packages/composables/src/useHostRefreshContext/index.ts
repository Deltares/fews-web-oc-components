import type { Ref } from 'vue'

export interface HostRefreshContext {
  /**
   * A ref that the host updates on a regular interval (e.g. every minute)
   * to act as a shared "system time" signal.
   *
   * Composables such as `useRefreshCoordinator` watch this ref to trigger
   * `onSystemTick` refreshes without each one needing its own timer.
   */
  systemTick: Ref<Date | undefined>
}

let hostRefreshContext: HostRefreshContext | null = null

/**
 * @beta
 *
 * Provides the host refresh context, making it available to micro-frontends
 * via {@link useHostRefreshContext}.
 *
 * Must be called by the host application before any micro-frontend that
 * relies on `onSystemTick` refreshes is mounted.
 *
 * @param context The refresh context to provide, including the `systemTick` ref.
 *
 * @example
 * ```ts
 * // Host application bootstrap
 * import { ref } from 'vue'
 * import { provideHostRefreshContext } from '@deltares/fews-web-oc-composables'
 *
 * const systemTick = ref<Date>()
 * setInterval(() => { systemTick.value = new Date() }, 60_000)
 *
 * provideHostRefreshContext({ systemTick })
 * ```
 */
export function provideHostRefreshContext(context: HostRefreshContext): void {
  hostRefreshContext = context
}

/**
 * @beta
 *
 * Retrieves the host refresh context that was previously provided via
 * {@link provideHostRefreshContext}.
 *
 * @returns The host refresh context.
 * @throws {Error} When no host refresh context has been provided yet.
 *
 * @example
 * ```ts
 * import { useHostRefreshContext } from '@deltares/fews-web-oc-composables'
 *
 * const { systemTick } = useHostRefreshContext()
 * ```
 */
export function useHostRefreshContext(): HostRefreshContext {
  if (!hostRefreshContext) {
    throw new Error(
      '@deltares/fews-web-oc-composables host refresh context was not provided. ' +
        'Ensure the host calls provideHostRefreshContext() before any remote loads.',
    )
  }

  return hostRefreshContext
}
