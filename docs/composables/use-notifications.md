# useNotifications

> **Beta** — this API is functional but may still change before it is considered stable.

Lets a host application provide a notifications/alerts implementation that
micro-frontends can use to surface messages to the user.

## Exported APIs

- `provideHostNotifications(notifications)`
- `useHostNotifications()`

## Example

```ts
// Host application bootstrap
import { provideHostNotifications } from '@deltares/fews-web-oc-composables'

provideHostNotifications({
  addAlert: ({ type, message }) => showSnackbar(type, message),
})
```

```ts
// Micro-frontend usage
import { useHostNotifications } from '@deltares/fews-web-oc-composables'

const notifications = useHostNotifications()

notifications.addAlert({
  id: crypto.randomUUID(),
  type: 'success',
  message: 'Saved successfully.',
})
```

## Parameters

| Function/Type                        | Description                                                                          | Default |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | --------- |
| `provideHostNotifications(notifications)` | `notifications.addAlert(request)` implementation to display alerts.                    | —        |
| `useHostNotifications()`                | Returns the previously provided implementation, or throws if none was provided.         | —        |
| `NotificationRequest`                   | `{ id: string, type: 'success' \| 'error' \| 'warning' \| 'info', message: string }`      | —        |

## Behavior

- `useHostNotifications()` throws an `Error` when no implementation has been
  provided yet.
