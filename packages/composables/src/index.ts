export {
  provideHostWebserviceContext,
  useHostWebserviceContext,
  type HostWebserviceContext,
  provideHostRefreshContext,
  useHostRefreshContext,
  type HostRefreshContext,
  provideHostNotifications,
  useHostNotifications,
  type HostNotifications,
  type NotificationRequest,
  type NotificationType,
  sharedRequest,
  getSharedRequestRegistrations,
  subscribeSharedRequestRegistrations,
  type SharedRequestRegistration,
  type SharedRequestRegistrationsListener,
} from './shared/index.js'

export type { PiWebserviceOptions } from './lib/requests/resolveWebserviceContext.js'
export type { PiTimeSeriesQueryOptions } from './lib/timeseries/applyTimeSeriesQueryOptions.js'

export {
  usePiLocations,
  type UsePiLocationsOptions,
  type UsePiLocationsReturn,
} from './usePiLocations/index.js'

export {
  usePiTimeSeries,
  type PiTimeSeriesRequest,
  type PiTimeSeriesEntry,
  type UsePiTimeSeriesOptions,
  type UsePiTimeSeriesReturn,
} from './usePiTimeSeries/index.js'

export {
  useWmsLayerCapabilities,
  type UseWmsLayerCapabilitiesOptions,
  useWmsLegend,
  type UseWmsLegendOptions,
  type UseWmsLegendReturn,
  fetchWmsLegend,
  type FetchWmsLegendOptions,
  useWmsCapabilities,
  type UseWmsCapabilitiesOptions,
  type UseWmsCapabilitiesReturn,
  type UseWmsOptions,
  type UseWmsRefreshOptions,
  type UseWmsRequestReturn,
  type UseWmsReturn,
} from './useWms/index.js'

export {
  useRefreshCoordinator,
  type RefreshPolicy,
  type RefreshCoordinator,
  type UseRefreshCoordinatorOptions,
} from './useRefreshCoordinator/index.js'

export { createDateRegistry, useDateRegistry } from './useDateRegistry/index.js'

export { useSharedRequestRegistrations } from './useSharedRequestRegistrations/index.js'
