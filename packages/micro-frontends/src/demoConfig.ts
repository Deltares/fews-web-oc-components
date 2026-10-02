import type { TopologyNode } from '@deltares/fews-pi-requests'

export const DEFAULT_SELECTED_TIME = Date.parse('2025-03-13T13:00:00Z')

export const mainTopologyNode: TopologyNode = {
  id: 'palmiet',
  name: 'D3 world map',
  filterIds: ['palmiet'],
}

export const criticalPointsTopologyNode: TopologyNode = {
  id: 'viewer_rivers_critical_points_forecast',
  name: 'Critical points',
  filterIds: ['SWMM Models_Simplified'],
}

export function resolveSelectedTime(value: unknown): number {
  if (typeof value !== 'string' || value.length === 0) {
    return DEFAULT_SELECTED_TIME
  }

  const selectedTime = Number(value)
  return Number.isFinite(selectedTime) ? selectedTime : DEFAULT_SELECTED_TIME
}
