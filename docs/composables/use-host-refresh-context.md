# useHostRefreshContext

Lets a host application provide a shared "system tick" signal that
micro-frontends can use to trigger refreshes, without each micro-frontend
needing its own timer.

## Exported APIs

- `provideHostRefreshContext(context)`
- `useHostRefreshContext()`

## Example

```ts
// Host application bootstrap
import { ref } from 'vue'
import { provideHostRefreshContext } from '@deltares/fews-web-oc-composables'

const systemTick = ref<Date>()
setInterval(() => {
  systemTick.value = new Date()
}, 60_000)

provideHostRefreshContext({ systemTick })
```

```ts
// Micro-frontend usage
import { useHostRefreshContext } from '@deltares/fews-web-oc-composables'

const { systemTick } = useHostRefreshContext()
```

## Parameters

| Function/Option                    | Description                                                                 | Default |
| ------------------------------------ | ------------------------------------------------------------------------------ | --------- |
| `provideHostRefreshContext(context)` | `context.systemTick` is a `Ref<Date \| undefined>` updated by the host.        | —        |
| `useHostRefreshContext()`            | Returns the previously provided context, or throws if none was provided.      | —        |

## Behavior

- `useHostRefreshContext()` throws an `Error` when no context has been provided
  yet, so make sure `provideHostRefreshContext()` is called before any
  micro-frontend relying on `onSystemTick` refreshes (see `useRefreshCoordinator`)
  is mounted.
