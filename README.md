[README.md](https://github.com/user-attachments/files/32902460/README.md)[Uploading README.md…# CIAPI PWA — Etapa 4: Dashboards Responsivos

## SUBSTITUIR

- `src/pages/DashboardPage.tsx`
- `src/sae/pages/SaeDashboardPage.tsx`

## ALTERAÇÕES

### CIAPI RH
- Mantida toda a lógica de carregamento e navegação.
- Cards passam a aproveitar melhor telas pequenas.
- Grid usa 1 coluna no celular, 2 em telas pequenas e 4 no desktop largo.
- Título, data/hora, botões e subtítulos foram ajustados para mobile.
- Botão "Novo Servidor" mantém largura total no celular.

### SAE
- Mantida a lógica atual do dashboard.
- KPIs ganham grid responsivo.
- Botão "Novo Agendamento" ocupa largura total no celular.
- Bloco "Agendamentos do Dia" não estoura a largura do app.
- A grade de agenda fica em rolagem horizontal local usando `.responsive-scroll`.
- Cards e espaçamentos foram reduzidos no celular e preservados no desktop.

Nenhum service, banco, autenticação, endpoint ou regra de negócio foi alterado.
]()
