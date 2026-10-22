import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI crashed:", error, info);
  }

  private handleRetry = () => {
    // opção 1: resetar estado e tentar renderizar de novo
    this.setState({ hasError: false, error: undefined });

    // opção 2 (mais forte): recarregar a página inteira
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ marginBottom: 8 }}>Ocorreu um erro ao abrir a tela</h2>
          <p style={{ marginTop: 0 }}>
            Abra o console (F12) para ver o erro completo. Abaixo vai um resumo:
          </p>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #333",
              overflow: "auto",
            }}
          >
            {String(this.state.error?.message ?? this.state.error ?? "Erro desconhecido")}
          </pre>

          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
