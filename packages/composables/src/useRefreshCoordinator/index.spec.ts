import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useRefreshCoordinator } from './index.js'

function createCoordinator(
  callback: () => void | Promise<void>,
  options: Parameters<typeof useRefreshCoordinator>[1],
) {
  const scope = effectScope()
  const coordinator = scope.run(() => useRefreshCoordinator(callback, options))!
  return { coordinator, scope }
}

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useRefreshCoordinator', () => {
  it('calls the callback immediately when requested', async () => {
    const callback = vi.fn()
    const { coordinator, scope } = createCoordinator(callback, {
      policies: [],
      immediateCallback: true,
    })

    expect(callback).toHaveBeenCalledOnce()
    await flushPromises()
    expect(coordinator.lastRefreshAt.value).toBeInstanceOf(Date)
    expect(coordinator.lastTriggerPolicy.value).toBe('manual')

    scope.stop()
  })

  it('refreshes when the system tick changes to a new date', async () => {
    const systemTick = ref<Date>()
    const callback = vi.fn()
    const { scope } = createCoordinator(callback, {
      policies: ['onSystemTick'],
      systemTick,
    })

    systemTick.value = new Date('2024-01-01T00:00:00Z')
    await nextTick()
    await flushPromises()
    expect(callback).toHaveBeenCalledOnce()

    systemTick.value = new Date('2024-01-01T00:00:00Z')
    await nextTick()
    expect(callback).toHaveBeenCalledOnce()

    systemTick.value = new Date('2024-01-01T00:01:00Z')
    await nextTick()
    await flushPromises()
    expect(callback).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('ignores triggers while paused or disabled', async () => {
    const enabled = ref(true)
    const callback = vi.fn()
    const { coordinator, scope } = createCoordinator(callback, {
      policies: [],
      enabled,
    })

    coordinator.pause()
    coordinator.trigger()
    await flushPromises()
    expect(callback).not.toHaveBeenCalled()
    expect(coordinator.isActive.value).toBe(false)

    coordinator.resume()
    enabled.value = false
    coordinator.trigger()
    await flushPromises()
    expect(callback).not.toHaveBeenCalled()
    expect(coordinator.isActive.value).toBe(true)

    scope.stop()
  })

  it('coalesces triggers during a running callback into one refresh', async () => {
    let resolveFirst!: () => void
    const callback = vi.fn(() => {
      if (callback.mock.calls.length === 1) {
        return new Promise<void>((resolve) => {
          resolveFirst = resolve
        })
      }
    })
    const { coordinator, scope } = createCoordinator(callback, { policies: [] })

    coordinator.trigger('manual')
    coordinator.trigger('manual')
    coordinator.trigger('manual')
    expect(callback).toHaveBeenCalledOnce()

    resolveFirst()
    await flushPromises()
    expect(callback).toHaveBeenCalledTimes(2)

    scope.stop()
  })

  it('uses the most recent policy for the coalesced refresh', async () => {
    let resolveFirst!: () => void
    const callback = vi.fn(() => {
      if (callback.mock.calls.length === 1) {
        return new Promise<void>((resolve) => {
          resolveFirst = resolve
        })
      }
    })
    const { coordinator, scope } = createCoordinator(callback, {
      policies: ['onSystemTick'],
      systemTick: ref<Date>(),
    })

    coordinator.trigger('manual')
    coordinator.trigger('onSystemTick')
    resolveFirst()
    await flushPromises()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(coordinator.lastTriggerPolicy.value).toBe('onSystemTick')
    scope.stop()
  })

  it('pauses and resumes its interval with the active state', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const { coordinator, scope } = createCoordinator(callback, {
      policies: ['onInterval'],
      intervalMs: 100,
    })

    coordinator.resume()
    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledOnce()

    coordinator.pause()
    await vi.advanceTimersByTimeAsync(300)
    expect(callback).toHaveBeenCalledOnce()

    coordinator.resume()
    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledTimes(2)

    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })
})
