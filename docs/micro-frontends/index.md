# Micro-frontends in FEWS WebOC

> [!IMPORTANT]
> This documentation is currently in proposal state. Package names and implementation details may change before final release.

Micro-frontends add focused views and tools to FEWS WebOC. A team can build a map, data-quality view, forecast summary, or another workflow that fits its users, then make it available from the WebOC interface.

This guide assumes your micro-frontend runs inside WebOC. WebOC loads the view, provides the FEWS connection and user authentication, and passes the selections configured for that view. Your component focuses on presenting information and responding to the user's actions.

## What You Can Build

Use a micro-frontend when you need a purpose-built way for people to explore data or complete a task in WebOC. For example, a view could:

- Show FEWS locations on a map and open their time series when selected.
- Summarize forecasts or highlight threshold exceedances.
- Help review data quality or compare scenarios.
- Combine FEWS information with data from an external service or dataset.

You choose how to present the information and which interactions your view supports. WebOC remains responsible for the overall application experience, including navigation and the shared FEWS connection.

## How It Fits into WebOC

Each micro-frontend is configured as a view in FEWS. The configuration determines where it appears and which FEWS selections, such as a Filter, are available to it. WebOC passes those selections to the view and handles navigation when the user moves between views.

When a view uses FEWS data, it can use the composables in this package to load locations or time series through the connection provided by WebOC. The view can also load external data when its workflow calls for it. Handle loading, errors, and empty results as part of the user experience, and make sure external services are available to the WebOC deployment.

## Demo Apps

Explore the [FEWS WebOC Micro Frontend Demo](https://deltares.github.io/fews-web-oc-components/micro-frontends/) to see two example apps. They illustrate how focused views can help people explore FEWS data. When loaded in WebOC, each app uses the FEWS instance, Filter, and user access configured for that environment.

### D3 World Map: FEWS Locations

The map displays locations from a FEWS Filter. Select a location to open its time series in WebOC. This example is useful as a starting point for map-based data exploration and location-focused workflows.

It uses [`usePiLocations`](../composables/use-pi-locations) to request locations from FEWS and keep the map data up to date.

### Critical Points: River Forecasts

This view brings river forecasts and threshold information together so users can quickly spot critical conditions. Users can search and filter the list, then select a location to open its time series in WebOC. It is a starting point for operational summary views that help users decide where to investigate.

It uses [`usePiTimeSeries`](../composables/use-pi-time-series) to load forecast data and [`useDateRegistry`](../composables/use-date-registry) to share the forecast's available dates with WebOC's date control.

## Get Started

- [Configure a Micro-frontend in FEWS](./configure-in-fews): add a view to FEWS and select the Filter or other settings it should use.
- [Develop a Micro-frontend for WebOC](./development): run a remote during development and connect it to WebOC.
- [Load FEWS Locations](./load-fews-locations): build a view around FEWS locations.
- [Load FEWS Time Series](./load-fews-timeseries-data): build a view around forecast or observation time series.
- [Show available dates](./date-registry): share a view's available dates with the WebOC date control.

For the available shared data tools, see the [Composables API](../composables/api/). For FEWS Web Services concepts, see the [Delft-FEWS documentation](https://fewsdocs.deltares.nl/).

> The sections below provide a more detailed implementation description for developers building a micro-frontend that runs in WebOC.

## Responsibilities

A micro-frontend owns the content and interactions inside its view. In practice, it should:

- Declare the inputs it needs, such as the configured FEWS node, selected locations, or date.
- Load and present the data for its task. Use the shared FEWS composables when they fit, or connect to an external data source when needed.
- Manage view-specific interactions, such as map zoom, search, filters, or selected rows.
- Notify WebOC about host-owned actions, such as opening another view. WebOC remains responsible for navigation and coordination between views.
- Use services provided by WebOC instead of passing service URLs or authentication settings through view props.
- Show loading, error, and empty states, and release subscriptions or other resources when the view is removed.

## Typical Contract

WebOC passes a view its configured inputs as props and responds to events emitted by the view. The exact inputs depend on the component. For example, this view receives a FEWS topology node and optional location and date selections, and emits a navigation event when a user chooses a location:

```vue
<MainComponent
	:topologyNode="topologyNode"
	:locationIds="locationIds"
	:selectedDate="selectedDate"
	@navigate="onNavigate"
/>
```

The component declares the shape of those inputs and events:

```ts
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
	topologyNode: TopologyNode
	locationIds?: string
	selectedDate?: Date
}

interface NavigationRoute {
	name: string
	params?: {
		locationIds: string
	}
}

interface Emits {
	(event: 'navigate', route: NavigationRoute): void
}
```

Here, `topologyNode` is required; the other selections are optional. WebOC supplies them when available. For example, it can pass the selected location to a time-series view and keep the date in sync with its date control. The component uses these inputs to decide what to show; WebOC handles navigation and the shared FEWS connection.

## What the Web OC Host Provides

WebOC gives the view two kinds of input:

- **View selections**, passed as props and defined by the component, such as a topology node, location, or date.
- **Shared services**, such as the FEWS Web Services URL and authentication headers. These are provided by WebOC and should not be passed as component props.

Before mounting a view that requests FEWS data, WebOC provides its service connection and authentication function. For example:

```ts
import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'

provideHostWebserviceContext({
	getBaseUrl: () => webservicesUrl,
	getAuthorizationHeaders: () => getHeaders(),
})
```

Data composables such as [`usePiLocations`](../composables/use-pi-locations) use this connection by default. Views that need host-driven refresh or notifications also rely on the corresponding context being provided before they mount. Because WebOC and the view share these services through the composables package, both must use the same shared package instance in the module-federation setup.

Views can also share their available dates with WebOC's date control using [`useDateRegistry`](../composables/use-date-registry). See [Showing the Date Time Slider](./date-registry) for the setup and example.