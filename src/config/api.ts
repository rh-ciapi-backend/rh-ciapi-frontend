/**
 * Configuração central da API do RH CIAPI
 */

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BACKEND_URL || 'https://api.rhciapi.com.br';

let healthCheckDone = false;

async function checkHealth() {
  if (healthCheckDone) return;
  healthCheckDone = true;

  console.log(`[API] API_BASE_URL = ${API_BASE_URL}`);

  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log(`[API] GET /health OK (Status: ${response.status})`);
    } else {
      console.error(`[API] GET /health FAIL (Status: ${response.status})`);
    }
  } catch (error: any) {
    console.error(`[API] GET /health FAIL (Network Error: ${error.message})`);
  }
}

if (typeof window !== 'undefined') {
  checkHealth();
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
}

export async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 15000, retry = true, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let attempts = 0;
  const maxAttempts = retry ? 2 : 1;

  while (attempts < maxAttempts) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      attempts++;

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // ignora fallback
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(id);

      if (attempts >= maxAttempts || error.name === 'AbortError') {
        const finalError =
          error.name === 'AbortError'
            ? 'Tempo limite de requisição excedido (15s)'
            : error.message;
        console.error(`[API] Erro final em ${path}:`, finalError);
        throw new Error(finalError);
      }

      console.warn(`[API] Falha na tentativa ${attempts} para ${path}. Tentando novamente...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Falha desconhecida na requisição');
}

export const API_CONFIG = {
  baseURL: `${API_BASE_URL}/api`,
  backendURL: API_BASE_URL,
  backendUrl: API_BASE_URL,
  apiBaseUrl: API_BASE_URL,
  baseUrl: API_BASE_URL,
  useMock: false,
};
