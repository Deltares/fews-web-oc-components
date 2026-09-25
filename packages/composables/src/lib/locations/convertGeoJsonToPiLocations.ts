import type { FeatureCollection, Geometry } from 'geojson'
import type { Location } from '@deltares/fews-pi-requests'

/**
 * Converts GeoJSON result to FEWS PI locations.
 *
 * The "properties" object for each feature in the GeoJSON is a valid FEWS PI location.
 *
 * @param geojson GeoJSON result with locations.
 * @returns List of FEWS PI locations.
 */
export function convertGeoJsonToPiLocations(
  geojson: FeatureCollection<Geometry, Location>,
): Location[] {
  return geojson.features.map((feature) => feature.properties)
}
