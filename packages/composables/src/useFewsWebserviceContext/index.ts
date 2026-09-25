export interface HostWebserviceContext {
  getBaseUrl: () => string
  getAuthorizationHeaders: () => Promise<Headers>
}

let hostWebserviceContext: HostWebserviceContext | null = null

export function provideHostWebserviceContext(
  context: HostWebserviceContext,
) {
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