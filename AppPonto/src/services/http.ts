const DEFAULT_TIMEOUT_MS = 20000;

export const API_TIMEOUT_MS = (() => {
  const raw = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? DEFAULT_TIMEOUT_MS : parsed;
})();

export async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Verifique sua conexão ou tente mais tarde");
    }
    if (
      error instanceof Error &&
      /network request failed/i.test(error.message)
    ) {
      throw new Error("Verifique sua conexão");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
