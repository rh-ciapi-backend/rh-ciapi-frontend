/**
 * Configuração central da API do RH CIAPI
 */

// URL base do backend (prioriza variável de ambiente do Vite)
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BACKEND_URL || 'https://api.rhciapi.com.br';

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

// Executa o check uma vez ao carregar o módulo
if (typeof window !== 'undefined') {
  checkHealth();
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
}

/**
 * Função robusta para chamadas à API com timeout, tratamento de erro e retry
 */
export async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 15000, retry = true, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  let attempts = 0;
  const maxAttempts = retry ? 2 : 1;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Fallback para texto se não for JSON
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      if (attempts >= maxAttempts || error.name === 'AbortError') {
        clearTimeout(id);
        const finalError = error.name === 'AbortError' ? 'Tempo limite de requisição excedido (15s)' : error.message;
        console.error(`[API] Erro final em ${path}:`, finalError);
        throw new Error(finalError);
      }
      console.warn(`[API] Falha na tentativa ${attempts} para ${path}. Tentando novamente...`);
      // Pequeno delay antes do retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Falha desconhecida na requisição');
}

export const API_CONFIG = {
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000/api',
  backendURL: API_BASE_URL,
  useMock: false,
};
