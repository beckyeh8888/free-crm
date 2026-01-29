/**
 * API Client - Type-safe fetch wrapper
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.error?.message || `Request failed with status ${response.status}`,
      response.status,
      body.error?.code
    );
  }
  return response.json();
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const searchParams = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(url + searchParams);
    return handleResponse<T>(response);
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, { method: 'DELETE' });
    return handleResponse<T>(response);
  },
};
