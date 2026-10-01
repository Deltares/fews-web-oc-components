# useHostWebserviceContext

Lets a host application provide the FEWS webservice base URL and
authorization headers that micro-frontends use for requests.

## Exported APIs

- `provideHostWebserviceContext(context)`
- `useHostWebserviceContext()`
- `resolveWebserviceContext(override?)`

## Example

```ts
// Host application bootstrap
import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'

provideHostWebserviceContext({
  getBaseUrl: () => 'https://example.localhost/fewswebservices',
  getAuthorizationHeaders: async () => {
    const headers = new Headers()
    headers.set('Authorization', `Bearer ${await getAccessToken()}`)
    return headers
  },
})
```

```ts
// Micro-frontend usage
import { useHostWebserviceContext } from '@deltares/fews-web-oc-composables'

const { getBaseUrl, getAuthorizationHeaders } = useHostWebserviceContext()
```

### Standalone usage via `resolveWebserviceContext`

Composables such as `usePiLocations` accept an optional `webservice` option
so they work outside a host application too:

```ts
import { resolveWebserviceContext } from '@deltares/fews-web-oc-composables'

// Uses the explicit override instead of the host context:
const { baseUrl, getAuthorizationHeaders } = resolveWebserviceContext({
  baseUrl: 'https://example.localhost/fewswebservices',
})
```

## Parameters

| Function/Option                                     | Description                                                                 | Default                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `provideHostWebserviceContext(context)`                 | `context.getBaseUrl` and `context.getAuthorizationHeaders` functions.          | —                                                    |
| `useHostWebserviceContext()`                            | Returns the previously provided context, or throws if none was provided.      | —                                                    |
| `resolveWebserviceContext(override?)`                   | `override.baseUrl` (required) and `override.getAuthorizationHeaders` (optional). | Falls back to `useHostWebserviceContext()` when `override` is omitted; `getAuthorizationHeaders` defaults to resolving empty `Headers`. |

## Behavior

- `useHostWebserviceContext()` throws an `Error` when no context has been
  provided yet.
- `resolveWebserviceContext()` is the recommended way for data-fetching
  composables to support both micro-frontend and standalone usage.
