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
  getBaseUrl: () => string
  getAuthorizationHeaders: () => Promise<Headers>
}

let hostWebserviceContext: HostWebserviceContext | null = null

export function provideHostWebserviceContext(
  context: HostWebserviceContext,
): void {
  hostWebserviceContext = context
}

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