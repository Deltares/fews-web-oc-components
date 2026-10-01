import { getCombinedDates, getSortedDates } from '../lib/dates/dates.js'
import {
  computed,
  provide,
  inject,
  onScopeDispose,
  type InjectionKey,
  toValue,
  type MaybeRefOrGetter,
  ref,
} from 'vue'

type DateRefOrGetter = MaybeRefOrGetter<Date[]>

interface DateRegistry {
  registerDates: (ref: DateRefOrGetter) => void
  unregisterDates: (ref: DateRefOrGetter) => void
}

const DATE_REGISTRY_KEY: InjectionKey<DateRegistry> = Symbol('DateRegistry')

/**
 * @beta
 *
 * Creates a registry that collects `Date[]` refs registered by descendant
 * components (via {@link useDateRegistry}) and combines them into a single,
 * de-duplicated, sorted list of dates.
 *
 * Must be called from `setup()` of an ancestor component, since it uses
 * `provide()` to make the registry available to descendants.
 *
 * @returns An object containing `combinedDates`, a computed `Date[]` ref with
 *   the sorted union of all dates registered by descendants.
 *
 * @example
 * ```ts
 * // ParentComponent.vue
 * import { createDateRegistry } from '@deltares/fews-web-oc-composables'
 *
 * const { combinedDates } = createDateRegistry()
 * ```
 * @group Composables
 */
export function createDateRegistry() {
  const dateRefs = ref<DateRefOrGetter[]>([])

  const registerDates = (ref: DateRefOrGetter) => {
    dateRefs.value.push(ref)
  }

  const unregisterDates = (ref: DateRefOrGetter) => {
    const index = dateRefs.value.indexOf(ref)
    if (index > -1) {
      dateRefs.value.splice(index, 1)
    }
  }

  const combinedDates = computed(() => {
    const dates = dateRefs.value.flatMap((ref) => toValue(ref))
    const combinedDates = getCombinedDates(dates)
    return getSortedDates(combinedDates)
  })

  provide(DATE_REGISTRY_KEY, { registerDates, unregisterDates })

  return { combinedDates }
}

/**
 * @beta
 *
 * Registers a `Date[]` ref (or getter) with the nearest ancestor
 * {@link createDateRegistry} registry, so its dates are included in the
 * registry's combined dates. The dates are unregistered automatically when
 * the calling component or effect scope is disposed.
 *
 * Does nothing if no ancestor registry was created.
 *
 * @param dates The reactive ref, or getter function, returning the `Date[]`
 *   to register.
 *
 * @example
 * ```ts
 * // ChildComponent.vue
 * import { ref } from 'vue'
 * import { useDateRegistry } from '@deltares/fews-web-oc-composables'
 *
 * const dates = ref<Date[]>([new Date('2024-01-01'), new Date('2024-01-02')])
 * useDateRegistry(dates)
 * ```
 * @group Composables
 */
export function useDateRegistry(dates: DateRefOrGetter) {
  const registry = inject(DATE_REGISTRY_KEY, undefined)
  if (!registry) return

  registry.registerDates(dates)

  onScopeDispose(() => {
    registry.unregisterDates(dates)
  }, true)
}
