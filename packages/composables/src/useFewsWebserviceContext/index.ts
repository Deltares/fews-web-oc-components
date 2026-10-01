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
 * Provides the FEWS webservice context, making it available to
 * micro-frontends via {@link useHostWebserviceContext}.
 *
 * @param context The webservice context to provide.
 *
 * @example
 * ```ts
 * import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'
 *
 * provideHostWebserviceContext({
 *   getBaseUrl: () => 'https://example.localhost/fewswebservices',
 *   getAuthorizationHeaders: async () => new Headers(),
 * })
 * ```
 */
export function provideHostWebserviceContext(
  context: HostWebserviceContext,
) {
  hostWebserviceContext = context
}

/**
 * Retrieves the FEWS webservice context that was previously provided via
 * {@link provideHostWebserviceContext}.
 *
 * @returns The host webservice context.
 * @throws {Error} When no host webservice context has been provided yet.
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