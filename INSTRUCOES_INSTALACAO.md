# CIAPI RH + SAE — Pacote completo do frontend (portal PMRR modernizado)

Este pacote consolida o projeto frontend e as correções do portal, incluindo `src/institutional.css` e a respectiva importação em `src/main.tsx`, além dos componentes de navegação.

## Implantação segura

1. Faça backup da branch `main` e crie uma branch de testes.
2. Envie os arquivos e pastas deste pacote **na raiz do repositório frontend**. Não crie uma segunda pasta `src`.
3. No GitHub, confirme os caminhos `src/institutional.css`, `src/main.tsx`, `src/components/InstitutionalHeader.tsx` e `src/components/InstitutionalNav.tsx`.
4. Configure as variáveis de ambiente da Vercel como na implantação original; não cole chaves privadas no código.
5. Execute `npm ci` e `npm run build`; verifique os logs e depois o login, as permissões, RH, SAE e exportações antes de colocar em produção.

## Limitações

Pacote consolidado a partir do último ZIP de frontend fornecido e dos pacotes de correção anteriores; não é um clone em tempo real do commit atual do GitHub. Não contém alterações ao backend nem migrações Supabase. Status dos testes registrado separadamente abaixo.
