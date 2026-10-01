import { describe, expect, it } from 'vitest'
import type { Location } from '@deltares/fews-pi-requests'
import type { FeatureCollection, Geometry } from 'geojson'
import { convertGeoJsonToPiLocations } from './convertGeoJsonToPiLocations.js'

describe('convertGeoJsonToPiLocations', () => {
  it('returns each feature properties object as a location', () => {
    const first = { locationId: 'first' } as Location
    const second = { locationId: 'second' } as Location
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: null, properties: first },
        { type: 'Feature', geometry: null, properties: second },
      ],
    } as unknown as FeatureCollection<Geometry, Location>

    const result = convertGeoJsonToPiLocations(geojson)

    expect(result).toEqual([first, second])
    expect(result[0]).toBe(first)
    expect(result[1]).toBe(second)
  })

  it('returns an empty list when the collection has no features', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [],
    } as unknown as FeatureCollection<Geometry, Location>

    expect(convertGeoJsonToPiLocations(geojson)).toEqual([])
  })
})
