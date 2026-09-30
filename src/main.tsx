/// <reference types="vite-plugin-pwa/client" />

import React, {
  useEffect,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import "./index.css";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

function PwaStatus() {
  const [online, setOnline] =
    useState<boolean>(navigator.onLine);

  const [needRefresh, setNeedRefresh] =
    useState(false);

  const [offlineReady, setOfflineReady] =
    useState(false);

  const [updateSW, setUpdateSW] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener(
      "online",
      handleOnline,
    );
    window.addEventListener(
      "offline",
      handleOffline,
    );

    const update = registerSW({
      immediate: true,

      onNeedRefresh() {
        setNeedRefresh(true);
      },

      onOfflineReady() {
        setOfflineReady(true);

        window.setTimeout(() => {
          setOfflineReady(false);
        }, 4500);
      },

      onRegisterError(error) {
        console.error(
          "[PWA] Falha ao registrar Service Worker:",
          error,
        );
      },
    });

    setUpdateSW(() => update);

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );
      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
  }, []);

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-3 z-[300] mx-auto max-w-xl rounded-2xl border border-amber-400/20 bg-[#172033] px-4 py-3 shadow-2xl sm:bottom-5"
        >
          <p className="text-sm font-bold text-white">
            Você está sem conexão com a internet.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            O CIAPI pode exibir a estrutura básica já
            carregada, mas consultas e alterações no RH,
            SAE e Supabase precisam de conexão.
          </p>
        </div>
      )}

      {online &&
        offlineReady &&
        !needRefresh && (
          <div
            role="status"
            className="fixed bottom-3 right-3 z-[300] max-w-sm rounded-2xl border border-emerald-400/20 bg-[#172033] px-4 py-3 shadow-2xl sm:bottom-5 sm:right-5"
          >
            <p className="text-sm font-bold text-white">
              CIAPI pronto para uso como aplicativo.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              A estrutura básica foi preparada com
              segurança.
            </p>
          </div>
        )}

      {needRefresh && (
        <div
          role="alert"
          className="fixed inset-x-3 bottom-3 z-[310] mx-auto max-w-xl rounded-2xl border border-blue-400/25 bg-[#172033] p-4 shadow-2xl sm:bottom-5"
        >
          <p className="text-sm font-bold text-white">
            Nova versão do CIAPI disponível.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Salve qualquer formulário que estiver
            preenchendo antes de atualizar. A atualização
            só será aplicada quando você confirmar.
          </p>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setNeedRefresh(false)
              }
              className="rounded-xl border border-[#26344a] px-3 py-2 text-xs font-bold text-slate-300 transition hover:text-white"
            >
              Depois
            </button>

            <button
              type="button"
              onClick={() => {
                if (updateSW) {
                  void updateSW(true);
                }
              }}
              className="rounded-xl bg-[#3b82f6] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2563eb]"
            >
              Atualizar agora
            </button>
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <PwaStatus />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
