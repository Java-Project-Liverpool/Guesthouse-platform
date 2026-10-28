const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const normalizedPath = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  const fullUrl = `${BASE_URL}${normalizedPath}`;

  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const data: unknown = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !path.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      const payload = typeof data === 'object' && data !== null
        ? data as { message?: unknown; requestId?: unknown }
        : {};
      const message = typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${res.status}`;
      const requestId = typeof payload.requestId === 'string'
        ? payload.requestId
        : res.headers.get('X-Request-Id') || undefined;
      throw new ApiError(message, res.status, requestId);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Network error or server unavailable.', { cause: err });
  }
}
