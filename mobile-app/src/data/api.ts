export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://dumela-stays-api.onrender.com'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
  timeoutMs?: number;
};

// Render may need extra time to wake its free service after a quiet period.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const data: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    if (!response.ok) {
      const fieldErrors =
        data && typeof data === 'object' && 'errors' in data && data.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).filter((value): value is string => typeof value === 'string').join(' ')
          : '';
      const message =
        fieldErrors || (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string')
          ? fieldErrors || (data as { message?: string }).message!
          : `The server returned an error (${response.status}).`;
      throw new ApiError(message, response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('The server is taking longer than expected. Please try again.');
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}
