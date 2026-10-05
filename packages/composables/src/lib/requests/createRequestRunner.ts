import { onScopeDispose, ref, shallowRef, type Ref } from 'vue'

export function createRequestRunner(enabled: Ref<boolean>) {
  const loading = ref(false)
  const refreshing = ref(false)
  const error = shallowRef<Error | null>(null)
  const hasLoaded = ref(false)
  const hasAttempted = ref(false)
  let requestId = 0
  let abortController: AbortController | null = null

  function cancel(): void {
    requestId++
    abortController?.abort()
    abortController = null
    loading.value = false
    refreshing.value = false
  }

  function reset(): void {
    cancel()
    error.value = null
    hasLoaded.value = false
    hasAttempted.value = false
  }

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    onSuccess: (response: T) => void,
    onError?: () => void,
  ): Promise<void> {
    if (!enabled.value) return

    cancel()
    const currentRequestId = requestId
    const controller = new AbortController()
    abortController = controller
    loading.value = !hasLoaded.value
    refreshing.value = hasLoaded.value
    error.value = null

    try {
      const response = await request(controller.signal)
      if (controller.signal.aborted || currentRequestId !== requestId) return

      onSuccess(response)
      hasLoaded.value = true
      hasAttempted.value = true
    } catch (cause) {
      if (controller.signal.aborted || currentRequestId !== requestId) return

      const requestError =
        cause instanceof Error ? cause : new Error(String(cause))
      error.value = requestError
      hasAttempted.value = true
      throw requestError
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false
        refreshing.value = false
        abortController = null
      }
    }
  }

  onScopeDispose(cancel, true)

  return {
    loading,
    refreshing,
    error,
    hasLoaded,
    hasAttempted,
    run,
    cancel,
    reset,
  }
}