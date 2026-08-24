/**
 * Rejects if `promise` does not settle within `ms` milliseconds.
 *
 * The z-ai-web-dev-sdk calls (page_reader retrieval, chat completions) have no
 * built-in timeout. If the backing service hangs on a slow/blocked URL, an
 * API route can otherwise hang indefinitely and wedge the dev server. Every
 * SDK call is therefore raced against this timeout so the route ALWAYS
 * responds (falling back to heuristic / "limited analysis" results).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`))
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}
