/**
 * Returns an absolute URL from a relative URL.
 * @param urlString - The URL string to convert to an absolute URL.
 * @returns The absolute URL.
 * @example
 * ```
  * absoluteUrl('/url') // => new URL('http://localhost:3000/url')
  * ```
  */
export function absoluteUrl(urlString: string): URL {
  let url!: URL
  try {
    url = new URL(urlString)
  } catch (error) {
    if (error instanceof TypeError) {
      url = new URL(urlString, document.baseURI)
    }
  }
  return url
}
