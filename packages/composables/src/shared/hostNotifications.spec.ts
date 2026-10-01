import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { HostNotifications } from './hostNotifications.js'

describe('hostNotifications', () => {
  beforeEach(() => {
    // Reset module state between tests because
    // hostNotifications is a module-level variable.
    vi.resetModules()
  })

  it('returns the provided host notifications instance', async () => {
    const { provideHostNotifications, useHostNotifications } = await import(
      './hostNotifications.js'
    )

    const notifications: HostNotifications = {
      addAlert: vi.fn(),
    }

    provideHostNotifications(notifications)

    expect(useHostNotifications()).toBe(notifications)
  })

  it('allows calling addNotification on the provided instance', async () => {
    const { provideHostNotifications, useHostNotifications } = await import(
      './hostNotifications.js'
    )

    const notifications: HostNotifications = {
      addAlert: vi.fn(),
    }

    provideHostNotifications(notifications)

    const host = useHostNotifications()

    host.addAlert({
      id: '1',
      type: 'success',
      message: 'Operation completed',
    })

    expect(notifications.addAlert).toHaveBeenCalledWith({
      id: '1',
      type: 'success',
      message: 'Operation completed',
    })
  })

  it('throws when host notifications have not been provided', async () => {
    const { useHostNotifications } = await import('./hostNotifications.js')

    expect(() => useHostNotifications()).toThrow(
      '@deltares/fews-web-oc-components host notifications were not provided.',
    )
  })
})