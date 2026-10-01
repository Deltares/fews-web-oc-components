import { describe, expect, it, vi } from 'vitest'
import { getInFlightRequestCount, sharedRequest } from './sharedRequest'

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
