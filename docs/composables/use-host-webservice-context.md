# useHostWebserviceContext

> **Beta** — this API is functional but may still change before it is considered stable.

Lets a host application provide the FEWS webservice base URL and
authorization headers that micro-frontends use for requests.

## Exported APIs

- `provideHostWebserviceContext(context)`
- `useHostWebserviceContext()`

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

### Standalone usage

Data-fetching composables such as `usePiLocations` and `usePiTimeSeries`
accept an optional `webservice` option, so they work without a host
application too:

```ts
import { usePiLocations } from '@deltares/fews-web-oc-composables'

const { locations } = usePiLocations({
  filter,
  webservice: {
    baseUrl: 'https://example.localhost/fewswebservices',
  },
})
```

## Parameters

| Function/Option                         | Description                                                              | Default |
| --------------------------------------- | ------------------------------------------------------------------------ | ------- |
| `provideHostWebserviceContext(context)` | `context.getBaseUrl` and `context.getAuthorizationHeaders` functions.    | —       |
| `useHostWebserviceContext()`            | Returns the previously provided context, or throws if none was provided. | —       |

## Behavior

- `useHostWebserviceContext()` throws an `Error` when no context has been
  provided yet.
- Data-fetching composables use the `webservice` option when given, and fall
  back to the host context otherwise. `getAuthorizationHeaders` defaults to
  sending no authorization headers.
