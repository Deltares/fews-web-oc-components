# @deltares/fews-web-oc-composables

## Overview

These Vue composables help applications work with FEWS data, including PI locations, WMS layers and legends, and coordinated refreshes. They are intended for use by WebOC itself, WebOC micro-frontends, and standalone Vue applications.

In WebOC, the host application can provide shared webservice configuration, refresh signals, and notifications to micro-frontends. Micro-frontends can then use the corresponding `useHost*` composables without configuring those services individually.

Standalone Vue applications can use data-fetching composables without a WebOC host by passing explicit webservice options (and an explicit system tick when using `onSystemTick` refreshes). The `provideHost*` functions are only needed when the application uses the host-context composables or relies on host-provided defaults; call them before mounting consumers that need those contexts.

## API availability and stability

Not all composables currently used by WebOC are available in this package yet. We will gradually migrate existing composables from WebOC into this repository so they can also be used by WebOC micro-frontends and standalone Vue applications. The API reference below lists what is available now.

**Beta** APIs are functional but may change before they are considered stable.

**Alpha** APIs may be incomplete or not fully functional, and may change before they are considered stable.