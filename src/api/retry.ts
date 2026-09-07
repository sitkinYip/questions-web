/** One logical request, with three silent retries after the first attempt. */
export async function withSilentRetry<T>(
  attempt: () => Promise<T>,
  options: {
    shouldRetry: (error: unknown) => boolean;
    signal?: AbortSignal;
    cancelled: () => Error;
    retries?: number;
  },
): Promise<T> {
  for (let index = 0; ; index++) {
    if (options.signal?.aborted) throw options.cancelled();
    try {
      return await attempt();
    } catch (error) {
      if (options.signal?.aborted) throw options.cancelled();
      if (index >= (options.retries ?? 3) || !options.shouldRetry(error))
        throw error;
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          window.clearTimeout(timer);
          reject(options.cancelled());
        };
        const timer = window.setTimeout(
          () => {
            options.signal?.removeEventListener("abort", abort);
            resolve();
          },
          400 * 2 ** index,
        );
        options.signal?.addEventListener("abort", abort, { once: true });
        if (options.signal?.aborted) abort();
      });
    }
  }
}

export function isTransientStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}
