import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'
import {
  subscribeSharedRequestRegistrations,
  type SharedRequestRegistration,
} from '../shared/sharedRequest.js'

/**
 * @beta
 *
 * Reactive list of the requests that are currently in flight via
 * {@link sharedRequest}. Unsubscribes when the current effect scope is
 * disposed.
 *
 * Registration keys may contain sensitive URL data; sanitise them before
 * displaying or logging.
 *
 * @returns A read-only ref with a frozen snapshot of the registrations.
 * @group Other Functions
 */
export function useSharedRequestRegistrations(): Readonly<
  ShallowRef<readonly SharedRequestRegistration[]>
> {
  const registrations = shallowRef<readonly SharedRequestRegistration[]>([])
  const unsubscribe = subscribeSharedRequestRegistrations((next) => {
    registrations.value = next
  })
  onScopeDispose(unsubscribe, true)
  return registrations
}
