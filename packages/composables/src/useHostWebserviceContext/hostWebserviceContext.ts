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

export interface HostWebserviceContext {
  /**
   * Returns the base URL of the FEWS webservices to use for requests.
   */
  getBaseUrl: () => string

  /**
   * Returns the headers to attach to authenticate outgoing requests.
   */
  getAuthorizationHeaders: () => Promise<Headers>
}

let hostWebserviceContext: HostWebserviceContext | null = null

/**
 * Provides the host webservice context, making it available to
 * micro-frontends via {@link useHostWebserviceContext}.
 *
 * Must be called by the host application before any micro-frontend that
 * relies on the host-provided webservice configuration is mounted.
 *
 * @param context The webservice context to provide.
 *
 * @example
 * ```ts
 * // Host application bootstrap
 * import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'
 *
 * provideHostWebserviceContext({
 *   getBaseUrl: () => 'https://example.localhost/fewswebservices',
 *   getAuthorizationHeaders: async () => {
 *     const headers = new Headers()
 *     headers.set('Authorization', `Bearer ${await getAccessToken()}`)
 *     return headers
 *   },
 * })
 * ```
 */
export function provideHostWebserviceContext(
  context: HostWebserviceContext,
) {
  hostWebserviceContext = context
}

/**
 * Retrieves the host webservice context that was previously provided via
 * {@link provideHostWebserviceContext}.
 *
 * @returns The host webservice context.
 * @throws {Error} When no host webservice context has been provided yet.
 *
 * @example
 * ```ts
 * import { useHostWebserviceContext } from '@deltares/fews-web-oc-composables'
 *
 * const { getBaseUrl, getAuthorizationHeaders } = useHostWebserviceContext()
 * ```
 */
export function useHostWebserviceContext(): HostWebserviceContext {
  if (!hostWebserviceContext) {
    throw new Error(
      '@deltares/fews-web-oc-composables host webservice context was not provided. ' +
        'Ensure the host calls provideHostWebserviceContext() before any remote loads.',
    )
  }

  return hostWebserviceContext
}


interface ResolvedWebserviceOptions {
  baseUrl: string
  getAuthorizationHeaders: () => Promise<Headers>
}

/**
 * Resolves the webservice configuration (base URL and authorization headers)
 * to use for a request, either from an explicit `override` or, when omitted,
 * from the host-provided webservice context.
 *
 * This allows data-fetching composables (e.g. `usePiLocations`) to work both
 * as a micro-frontend (using {@link useHostWebserviceContext}) and standalone,
 * by passing a `webservice` option explicitly.
 *
 * @param override Explicit webservice options to use instead of the host
 *   context. When omitted, {@link useHostWebserviceContext} is used, which
 *   throws if no host context has been provided.
 * @returns The resolved `baseUrl` and `getAuthorizationHeaders` function.
 *   When `override.getAuthorizationHeaders` is omitted, it defaults to a
 *   function that resolves to empty `Headers` (unauthenticated requests).
 *
 * @example
 * ```ts
 * import { resolveWebserviceContext } from '@deltares/fews-web-oc-composables'
 *
 * // Standalone usage with an explicit override:
 * const { baseUrl, getAuthorizationHeaders } = resolveWebserviceContext({
 *   baseUrl: 'https://example.localhost/fewswebservices',
 * })
 *
 * // Micro-frontend usage, relying on the host-provided context:
 * const { baseUrl, getAuthorizationHeaders } = resolveWebserviceContext()
 * ```
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
    getAuthorizationHeaders:
      hostContext.getAuthorizationHeaders,
  }
}