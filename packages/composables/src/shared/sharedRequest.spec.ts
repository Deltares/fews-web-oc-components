import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getInFlightRequestCount,
  getSharedRequestRegistrations,
  sharedRequest,
  subscribeSharedRequestRegistrations,
  type SharedRequestRegistration,
} from './sharedRequest.js'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('sharedRequest', () => {
  it('runs concurrent requests with the same key once', async () => {
    const pending = deferred<string>()
    const run = vi.fn(() => pending.promise)

    const first = sharedRequest('same', run)
    const second = sharedRequest('same', run)
    pending.resolve('result')

    await expect(first).resolves.toBe('result')
    await expect(second).resolves.toBe('result')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('runs requests with different keys separately', async () => {
    const run = vi.fn(async (_signal: AbortSignal) => 'result')

    await Promise.all([sharedRequest('a', run), sharedRequest('b', run)])

    expect(run).toHaveBeenCalledTimes(2)
  })

  it('starts a new request once the previous one has settled', async () => {
    const run = vi.fn(async () => 'result')

    await sharedRequest('settled', run)
    await sharedRequest('settled', run)

    expect(run).toHaveBeenCalledTimes(2)
    expect(getInFlightRequestCount()).toBe(0)
  })

  it('rejects all subscribers when the request fails', async () => {
    const pending = deferred<string>()
    const run = vi.fn(() => pending.promise)
    const error = new Error('failed')

    const first = sharedRequest('failing', run)
    const second = sharedRequest('failing', run)
    pending.reject(error)

    await expect(first).rejects.toBe(error)
    await expect(second).rejects.toBe(error)
    expect(getInFlightRequestCount()).toBe(0)
  })

  it('rejects when run throws synchronously', async () => {
    const error = new Error('sync failure')

    await expect(
      sharedRequest('throwing', () => {
        throw error
      }),
    ).rejects.toBe(error)
  })

  it('detaches an aborted subscriber without aborting the shared request', async () => {
    const pending = deferred<string>()
    let sharedSignal: AbortSignal | undefined
    const run = vi.fn((signal: AbortSignal) => {
      sharedSignal = signal
      return pending.promise
    })

    const controller = new AbortController()
    const aborted = sharedRequest('partial-abort', run, controller.signal)
    const remaining = sharedRequest('partial-abort', run)

    controller.abort()
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' })
    expect(sharedSignal?.aborted).toBe(false)

    pending.resolve('result')
    await expect(remaining).resolves.toBe('result')
  })

  it('aborts the shared request when all subscribers have aborted', async () => {
    let sharedSignal: AbortSignal | undefined
    const run = vi.fn((signal: AbortSignal) => {
      sharedSignal = signal
      return new Promise<string>(() => {})
    })

    const first = new AbortController()
    const second = new AbortController()
    const firstResult = sharedRequest('full-abort', run, first.signal)
    const secondResult = sharedRequest('full-abort', run, second.signal)
    await Promise.resolve()

    first.abort()
    second.abort()

    await expect(firstResult).rejects.toMatchObject({ name: 'AbortError' })
    await expect(secondResult).rejects.toMatchObject({ name: 'AbortError' })
    expect(sharedSignal?.aborted).toBe(true)
    expect(getInFlightRequestCount()).toBe(0)
  })

  it('starts a new request after all subscribers have aborted', async () => {
    const run = vi.fn(async () => 'result')

    const controller = new AbortController()
    const aborted = sharedRequest('restart', run, controller.signal)
    controller.abort()
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' })

    await expect(sharedRequest('restart', run)).resolves.toBe('result')
  })

  it('rejects immediately when the signal is already aborted', async () => {
    const run = vi.fn(async () => 'result')
    const controller = new AbortController()
    controller.abort()

    await expect(
      sharedRequest('pre-aborted', run, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(run).not.toHaveBeenCalled()
  })
})

describe('shared request registrations', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function record() {
    const snapshots: (readonly SharedRequestRegistration[])[] = []
    const unsubscribe = subscribeSharedRequestRegistrations((registrations) =>
      snapshots.push(registrations),
    )
    return { snapshots, unsubscribe }
  }

  it('delivers the current snapshot on subscribe', () => {
    const listener = vi.fn()

    const unsubscribe = subscribeSharedRequestRegistrations(listener)

    expect(listener).toHaveBeenCalledExactlyOnceWith([])
    unsubscribe()
  })

  it('reports a registered request with its key, subscriber count and start time', async () => {
    vi.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') })
    const pending = deferred<string>()
    const { snapshots, unsubscribe } = record()

    const result = sharedRequest('/api/registered', () => pending.promise)

    expect(getSharedRequestRegistrations()).toEqual([
      {
        key: '/api/registered',
        subscriberCount: 1,
        startedAt: Date.parse('2024-01-01T00:00:00Z'),
      },
    ])
    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]).toBe(getSharedRequestRegistrations())

    pending.resolve('result')
    await result
    unsubscribe()
  })

  it('counts concurrent subscribers of the same key in one registration', async () => {
    const pending = deferred<string>()
    const { snapshots, unsubscribe } = record()

    const first = sharedRequest('concurrent', () => pending.promise)
    const second = sharedRequest('concurrent', () => pending.promise)

    expect(snapshots.map((s) => s.map((r) => r.subscriberCount))).toEqual([
      [],
      [1],
      [2],
    ])
    expect(snapshots[2][0].startedAt).toBe(snapshots[1][0].startedAt)

    pending.resolve('result')
    await Promise.all([first, second])
    unsubscribe()
  })

  it('decrements the subscriber count when a subscriber aborts', async () => {
    const pending = deferred<string>()
    const controller = new AbortController()
    const aborted = sharedRequest(
      'detach',
      () => pending.promise,
      controller.signal,
    )
    const remaining = sharedRequest('detach', () => pending.promise)
    const { snapshots, unsubscribe } = record()

    controller.abort()
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' })

    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]).toEqual([
      expect.objectContaining({ key: 'detach', subscriberCount: 1 }),
    ])

    pending.resolve('result')
    await remaining
    unsubscribe()
  })

  it('removes the registration when all subscribers abort', async () => {
    const controller = new AbortController()
    const result = sharedRequest(
      'abort-all',
      () => new Promise<string>(() => {}),
      controller.signal,
    )
    const { snapshots, unsubscribe } = record()

    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })

    expect(snapshots).toEqual([
      [expect.objectContaining({ key: 'abort-all' })],
      [],
    ])
    expect(getSharedRequestRegistrations()).toEqual([])
    unsubscribe()
  })

  it('removes the registration once when the request completes', async () => {
    const pending = deferred<string>()
    const first = sharedRequest('complete', () => pending.promise)
    const second = sharedRequest('complete', () => pending.promise)
    const { snapshots, unsubscribe } = record()

    pending.resolve('result')
    await Promise.all([first, second])

    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]).toEqual([])
    expect(getSharedRequestRegistrations()).toEqual([])
    unsubscribe()
  })

  it('removes the registration when the request fails', async () => {
    const pending = deferred<string>()
    const error = new Error('failed')
    const result = sharedRequest('error', () => pending.promise)
    const { snapshots, unsubscribe } = record()

    pending.reject(error)
    await expect(result).rejects.toBe(error)

    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]).toEqual([])
    unsubscribe()
  })

  it('returns frozen snapshots that are not affected by later changes', async () => {
    const pending = deferred<string>()
    const first = sharedRequest('isolated', () => pending.promise)
    const before = getSharedRequestRegistrations()

    const second = sharedRequest('isolated', () => pending.promise)
    const after = getSharedRequestRegistrations()

    expect(Object.isFrozen(before)).toBe(true)
    expect(Object.isFrozen(before[0])).toBe(true)
    expect(() => {
      ;(before as SharedRequestRegistration[]).push(before[0])
    }).toThrow(TypeError)
    expect(before).not.toBe(after)
    expect(before[0].subscriberCount).toBe(1)
    expect(after[0].subscriberCount).toBe(2)
    expect(Object.keys(after[0]).sort()).toEqual([
      'key',
      'startedAt',
      'subscriberCount',
    ])

    pending.resolve('result')
    await Promise.all([first, second])
    expect(before[0].subscriberCount).toBe(1)
  })

  it('stops notifying after unsubscribe', async () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSharedRequestRegistrations(listener)
    unsubscribe()
    unsubscribe()

    await sharedRequest('unsubscribed', async () => 'result')

    expect(listener).toHaveBeenCalledOnce()
  })

  it('keeps notifying other listeners when one throws', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const failing = vi.fn()
    const unsubscribeFailing = subscribeSharedRequestRegistrations(failing)
    failing.mockImplementation(() => {
      throw new Error('listener failed')
    })
    const { snapshots, unsubscribe } = record()

    await expect(
      sharedRequest('faulty-listener', async () => 'result'),
    ).resolves.toBe('result')

    expect(snapshots.map((s) => s.length)).toEqual([0, 1, 0])
    expect(consoleError).toHaveBeenCalled()
    unsubscribeFailing()
    unsubscribe()
    consoleError.mockRestore()
  })
})
