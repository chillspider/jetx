export function getVariableName<TResult>(
  getVar: () => TResult,
): string | undefined {
  const m = /\(\)=>(.*)/.exec(
    getVar.toString().replaceAll(/(\r\n|\n|\r|\s)/gm, ''),
  );

  if (!m) {
    throw new Error(
      "The function does not contain a statement matching 'return variableName;'",
    );
  }

  const fullMemberName = m[1]!;

  const memberParts = fullMemberName.split('.');

  return memberParts.at(-1);
}

/**
 * Retries a function with exponential backoff and optional jitter.
 * @param fn - The function to retry.
 * @param retries - The number of retry attempts.
 * @param delay - The initial delay in milliseconds.
 * @param onRetry - Optional callback to execute on each retry attempt.
 * @param jitter - Optional jitter factor to add randomness to the delay.
 * @returns The result of the function if successful.
 * @throws The error if all retry attempts fail.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000, // Initial delay in milliseconds
  onRetry?: (attempt: number, error: any) => void,
  jitter: number = 0.1, // Jitter factor (0.1 means up to 10% random variation)
): Promise<T> {
  const MAX_DELAY = 20000; // Maximum delay of 20 seconds
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retries) {
        attempt++;
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Calculate the delay with exponential backoff and optional jitter
        let dynamicDelay = delay * Math.pow(2, attempt);
        if (jitter > 0) {
          const jitterValue = dynamicDelay * jitter * (Math.random() - 0.5);
          dynamicDelay += jitterValue;
        }

        // Cap the delay at MAX_DELAY
        dynamicDelay = Math.min(dynamicDelay, MAX_DELAY);

        await sleep(dynamicDelay);
      } else {
        throw error;
      }
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
