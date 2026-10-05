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
 * @beta
 *
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
 * @group Providers
 */
export function provideHostWebserviceContext(
  context: HostWebserviceContext,
) {
  hostWebserviceContext = context
}

/**
 * @beta
 *
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
 * @group Composables
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
