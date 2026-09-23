export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationRequest {
  id: string
  type: NotificationType
  message: string
}

export interface HostNotifications {
  addNotification(request: NotificationRequest): void
}

let hostNotifications: HostNotifications | null = null

export function provideHostNotifications(notifications: HostNotifications) {
  hostNotifications = notifications
}

export function useHostNotifications(): HostNotifications {
  if (!hostNotifications) {
    throw new Error(
      '@deltares/fews-web-oc-components host notifications were not provided. ' +
        'Ensure the host calls provideHostNotifications() before any remote loads.',
    )
  }
  return hostNotifications
}
