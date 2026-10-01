import { useHostWebserviceContext } from '../../shared/hostWebserviceContext'

/**
 * Webservice configuration for standalone usage of the data-fetching
 * composables.
 */
export interface PiWebserviceOptions {
  /**
   * FEWS Web Services base URL.
   */
  baseUrl: string

  /**
   * Optional authentication headers.
   *
   * If omitted, requests are sent without authentication.
   */
  getAuthorizationHeaders?: () => Promise<Headers>
}

export interface ResolvedWebserviceOptions {
  baseUrl: string
  getAuthorizationHeaders: () => Promise<Headers>
}

/**
 * Resolves the webservice configuration from an explicit `override` or,
 * when omitted, from the host-provided webservice context.
 *
 * @throws {Error} When `override` is omitted and no host context has been provided.
 */
export function resolveWebserviceContext(
  override?: PiWebserviceOptions,
): ResolvedWebserviceOptions {
  if (override) {
    return {
      baseUrl: override.baseUrl,
      getAuthorizationHeaders:
        override.getAuthorizationHeaders ??
        (() => Promise.resolve(new Headers())),
    }
  }

  const hostContext = useHostWebserviceContext()

  return {
    baseUrl: hostContext.getBaseUrl(),
    getAuthorizationHeaders: hostContext.getAuthorizationHeaders,
  }
}
