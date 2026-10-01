export function createTransformRequestFn(
  getAuthorizationHeaders: () => Promise<Headers>,
  getAbortSignal: () => AbortSignal | undefined,
) {
  return async (request: Request): Promise<Request> => {
    const authorizationHeaders = await getAuthorizationHeaders()

    const headers = new Headers(request.headers)

    authorizationHeaders.forEach((value, key) => {
      headers.set(key, value)
    })

    const signal = getAbortSignal()

    return new Request(request, {
      headers,
      ...(signal ? { signal } : {}),
    })
  }
}
