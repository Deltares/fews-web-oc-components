# Composables

The composables package exports helpers for fetching FEWS data (locations,
time series, WMS layers), sharing available dates, and integrating
micro-frontends with a host application (webservice configuration, refresh
signals, notifications, and in-flight request diagnostics).

## Composables by Use Case

Most micro-frontends start with the data-loading composables. Use the host-integration composables when the remote needs host services or needs to send information back to WebOC. Advanced controls are optional for custom workflows.

### Load FEWS Data

- [usePiLocations](./use-pi-locations) — fetch and refresh locations using a FEWS PI filter.
- [usePiTimeSeries](./use-pi-time-series) — load keyed time-series requests and track their state.
- [useWms](./use-wms) — load WMS capabilities, layer times, and legend graphics.

### Send Information to WebOC

- [useNotifications](./use-notifications) — ask the host to display a notification or alert.
- [useDateRegistry](./use-date-registry) — register dates from a remote so WebOC can populate its shared DateTimeSlider. The host creates the registry with `createDateRegistry`.

### Use Host-Provided Context

- [useHostWebserviceContext](./use-host-webservice-context) — access the host's FEWS Web Services URL and authorization headers.
- [useHostRefreshContext](./use-host-refresh-context) — access the host's shared system-time refresh signal.

### Advanced Controls and Diagnostics

- [useRefreshCoordinator](./use-refresh-coordinator) — coordinate custom refresh callbacks and policies; the data-loading composables already use it internally.
- [Shared Request Inspection](./shared-request-inspection) — inspect in-flight deduplicated requests for diagnostics or monitoring.
