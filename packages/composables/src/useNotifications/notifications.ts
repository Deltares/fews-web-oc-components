export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationRequest {
  /**
   * A unique identifier for the notification, e.g. used to dismiss it later.
   */
  id: string

  /**
   * The severity/style of the notification.
   */
  type: NotificationType

  /**
   * The message to display to the user.
   */
  message: string
}

export interface HostNotifications {
  /**
   * Requests the host to display an alert/notification to the user.
   */
  addAlert(request: NotificationRequest): void
}

let hostNotifications: HostNotifications | null = null

/**
 * Provides the host notifications implementation, making it available to
 * micro-frontends via {@link useHostNotifications}.
 *
 * Must be called by the host application before any micro-frontend that
 * raises notifications is mounted.
 *
 * @param notifications The host notifications implementation to provide.
 *
 * @example
 * ```ts
 * // Host application bootstrap
 * import { provideHostNotifications } from '@deltares/fews-web-oc-composables'
 *
 * provideHostNotifications({
 *   addAlert: ({ type, message }) => showSnackbar(type, message),
 * })
 * ```
 */
export function provideHostNotifications(notifications: HostNotifications) {
  hostNotifications = notifications
}

/**
 * Retrieves the host notifications implementation that was previously
 * provided via {@link provideHostNotifications}.
 *
 * @returns The host notifications implementation.
 * @throws {Error} When no host notifications have been provided yet.
 *
 * @example
 * ```ts
 * import { useHostNotifications } from '@deltares/fews-web-oc-composables'
 *
 * const notifications = useHostNotifications()
 * notifications.addAlert({
 *   id: crypto.randomUUID(),
 *   type: 'success',
 *   message: 'Saved successfully.',
 * })
 * ```
 */
export function useHostNotifications(): HostNotifications {
  if (!hostNotifications) {
    throw new Error(
      '@deltares/fews-web-oc-components host notifications were not provided. ' +
        'Ensure the host calls provideHostNotifications() before any remote loads.',
    )
  }
  return hostNotifications
}
