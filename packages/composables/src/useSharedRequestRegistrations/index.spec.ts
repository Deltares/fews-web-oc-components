import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { sharedRequest } from '../shared/sharedRequest.js'
import { useSharedRequestRegistrations } from './index.js'

describe('useSharedRequestRegistrations', () => {
  it('tracks in-flight requests until the scope is disposed', async () => {
    let resolve!: (value: string) => void
    const pending = new Promise<string>((res) => (resolve = res))
    const scope = effectScope()
    const registrations = scope.run(() => useSharedRequestRegistrations())!

    expect(registrations.value).toEqual([])

    const result = sharedRequest('composable', () => pending)
    expect(registrations.value).toEqual([
      expect.objectContaining({ key: 'composable', subscriberCount: 1 }),
    ])

    scope.stop()
    resolve('result')
    await result

    expect(registrations.value).toHaveLength(1)
  })
})
