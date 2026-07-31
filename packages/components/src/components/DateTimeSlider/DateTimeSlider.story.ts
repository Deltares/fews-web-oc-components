import { defineComponent, h, ref } from 'vue'
import DateTimeSlider from './DateTimeSlider.vue'

const baseDates = [
  new Date('2099-10-21T00:00:00.000Z'),
  new Date('2099-10-22T00:00:00.000Z'),
  new Date('2099-10-23T00:00:00.000Z'),
]

export const Stateful = defineComponent(() => {
  const modelValue = ref(new Date(baseDates[1]))
  const nowValue = ref(false)

  return () =>
    h('div', [
      h(DateTimeSlider, {
        modelValue: modelValue.value,
        'onUpdate:modelValue': (value: Date) => {
          modelValue.value = value
        },
        now: nowValue.value,
        'onUpdate:now': (value: boolean) => {
          nowValue.value = value
        },
        dates: baseDates,
      }),
      h('form', { hidden: true }, [
        h('input', {
          'data-testid': 'model-value',
          readOnly: true,
          value: modelValue.value.toISOString(),
        }),
        h('input', {
          'data-testid': 'now-value',
          readOnly: true,
          value: String(nowValue.value),
        }),
      ]),
    ])
})
