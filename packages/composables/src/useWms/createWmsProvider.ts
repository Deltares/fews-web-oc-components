import { WMSProvider } from '@deltares/fews-wms-requests'
import { createTransformRequestFn } from '../lib/requests/createTransformRequestFn.js'
import type { ResolvedWebserviceOptions } from '../lib/requests/resolveWebserviceContext.js'

export function createWmsProvider(
  webservice: ResolvedWebserviceOptions,
  getAbortSignal: () => AbortSignal | undefined,
): WMSProvider {
  return new WMSProvider(`${webservice.baseUrl}/wms`, {
    transformRequestFn: createTransformRequestFn(
      webservice.getAuthorizationHeaders,
      getAbortSignal,
    ),
  })
}