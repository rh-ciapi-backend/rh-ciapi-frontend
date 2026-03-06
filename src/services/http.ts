import { fetchJson, FetchOptions } from '../config/api';

const isBodyInit = (value: unknown): value is BodyInit =>
  value instanceof FormData ||
  value instanceof URLSearchParams ||
  value instanceof Blob ||
  typeof value === 'string';

const withMethod = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options?: FetchOptions
): FetchOptions => ({
  ...options,
  method,
});

const withJsonBody = (
  method: 'POST' | 'PUT',
  body: unknown,
  options?: FetchOptions
): FetchOptions => {
  if (body === undefined) {
    return withMethod(method, options);
  }

  if (isBodyInit(body)) {
    return {
      ...options,
      method,
      body,
    };
  }

  return {
    ...options,
    method,
    body: JSON.stringify(body ?? {}),
  };
};

export const http = {
  get: <T>(path: string, options?: FetchOptions) =>
    fetchJson<T>(path, withMethod('GET', options)),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(path, withJsonBody('POST', body, options)),

  put: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(path, withJsonBody('PUT', body, options)),

  delete: <T>(path: string, options?: FetchOptions) =>
    fetchJson<T>(path, withMethod('DELETE', options)),
};
