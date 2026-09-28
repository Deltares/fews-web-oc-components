import type { Ref } from 'vue'

export interface HostRefreshContext {
  systemTick: Ref<Date | undefined>
}

let hostRefreshContext: HostRefreshContext | null = null

export function provideHostRefreshContext(context: HostRefreshContext): void {
  hostRefreshContext = context
}

export function useHostRefreshContext(): HostRefreshContext {
  if (!hostRefreshContext) {
    throw new Error(
      '@deltares/fews-web-oc-composables host refresh context was not provided. ' +
        'Ensure the host calls provideHostRefreshContext() before any remote loads.',
    )
  }

  return hostRefreshContext
}
