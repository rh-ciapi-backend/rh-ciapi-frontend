# CIAPI RH + SAE: portal PMRR modernizado (v2)

## Alterações
- Página inicial tem apenas cartões CIAPI RH e SAE. O login é aberto depois da seleção.
- Novo cabeçalho com a logomarca fornecida pelo usuário, em `public/images/governo-roraima-logo.png`.
- Preservados os serviços de autenticação Supabase, módulos e páginas internas.
- Os arquivos alterados em relação ao ZIP completo anterior são `src/pages/LoginPage.tsx`, `src/components/InstitutionalHeader.tsx`, `src/institutional.css` e `public/images/governo-roraima-logo.png`.

## Implantação
Enviar as pastas `src` e `public` com a estrutura original preservada para uma branch de testes. Não recriar Supabase ou substituir backend. Verificar instalação de dependências, build e fluxos de RH e SAE antes da produção.

## Referência de identidade visual
Manual de Identidade Visual do Governo de Roraima: https://portal.rr.gov.br/wp-content/uploads/2024/04/MIV-GOV-RR.pdf
Confira as regras de marca institucional antes de uso oficial.
