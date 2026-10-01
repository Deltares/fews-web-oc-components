# Composables

The composables package exports helpers for fetching FEWS data (locations,
WMS layers) and for integrating micro-frontends with a host application
(webservice configuration, refresh signals, notifications).

Import from the package:

```ts
import {
  usePiLocations,
  useWmsLayerCapabilities,
  useWmsLegend,
  fetchWmsLegend,
  useWmsCapilities,
  provideHostWebserviceContext,
  useHostWebserviceContext,
  provideHostRefreshContext,
  useHostRefreshContext,
  provideHostNotifications,
  useHostNotifications
} from '@deltares/fews-web-oc-composables'
```

## Composable Docs

- [useLocations](./use-locations)
- [useWms](./use-wms)
- [useHostWebserviceContext](./use-host-webservice-context)
- [useHostRefreshContext](./use-host-refresh-context)
- [useNotifications](./use-notifications)
