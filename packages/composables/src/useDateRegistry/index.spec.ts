import { describe, expect, it } from 'vitest'
import {
  createSSRApp,
  defineComponent,
  effectScope,
  h,
  ref,
  type ComputedRef,
} from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createDateRegistry, useDateRegistry } from './index'

/**
 * Renders a parent with a date registry and one child per setup function.
 */
async function renderRegistry(
  ...childSetups: (() => void)[]
): Promise<ComputedRef<Date[]>> {
  let combinedDates!: ComputedRef<Date[]>

  const children = childSetups.map((setup) =>
    defineComponent({
      setup() {
        setup()
        return () => h('span')
      },
    }),
  )

  const app = createSSRApp(
    defineComponent({
      setup() {
        ;({ combinedDates } = createDateRegistry())
        return () => h('div', children.map((child) => h(child)))
      },
    }),
  )
  await renderToString(app)

  return combinedDates
}

describe('createDateRegistry', () => {
  it('combines, de-duplicates and sorts the registered dates', async () => {
    const combinedDates = await renderRegistry(
      () =>
        useDateRegistry(ref([new Date('2024-01-03'), new Date('2024-01-01')])),
      () =>
        useDateRegistry(() => [new Date('2024-01-02'), new Date('2024-01-01')]),
    )

    expect(combinedDates.value).toEqual([
      new Date('2024-01-01'),
      new Date('2024-01-02'),
      new Date('2024-01-03'),
    ])
  })

  it('updates when registered dates change', async () => {
    const dates = ref([new Date('2024-01-01')])
    const combinedDates = await renderRegistry(() => useDateRegistry(dates))

    dates.value = [new Date('2024-01-02')]

    expect(combinedDates.value).toEqual([new Date('2024-01-02')])
  })
})

describe('useDateRegistry', () => {
  it('unregisters the dates when its scope is disposed', async () => {
    const scope = effectScope()
    const combinedDates = await renderRegistry(() => {
      useDateRegistry(ref([new Date('2024-01-01')]))
      scope.run(() => useDateRegistry(ref([new Date('2024-01-02')])))
    })

    expect(combinedDates.value).toHaveLength(2)

    scope.stop()

    expect(combinedDates.value).toEqual([new Date('2024-01-01')])
  })

  it('does nothing without an ancestor registry', async () => {
    const app = createSSRApp(
      defineComponent({
        setup() {
          useDateRegistry(ref([new Date('2024-01-01')]))
          return () => h('div')
        },
      }),
    )

    await expect(renderToString(app)).resolves.toBe('<div></div>')
  })
})
