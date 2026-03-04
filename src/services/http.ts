import { fetchJson, FetchOptions } from '../config/api';

export const http = {
  get: <T>(path: string, options?: FetchOptions) => 
    fetchJson<T>(path, { ...options, method: 'GET' }),
    
  post: <T>(path: string, body: any, options?: FetchOptions) => 
    fetchJson<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: <T>(path: string, body: any, options?: FetchOptions) => 
    fetchJson<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: <T>(path: string, options?: FetchOptions) => 
    fetchJson<T>(path, { ...options, method: 'DELETE' }),
};
