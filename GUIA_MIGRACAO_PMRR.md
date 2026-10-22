# Migração CIAPI RH + SAE — Portal institucional

## Implementado
- Tela de entrada com seleção de ambiente CIAPI RH ou SAE e autenticação Supabase já existente.
- Cabeçalho institucional comum ao login, RH e SAE.
- Menu horizontal responsivo do RH com acesso às rotas existentes.
- Barra da página RH com identificação da conta autenticada.
- SAE com cabeçalho institucional; navegação e regras de acesso próprias preservadas.
- Sem migrações de banco, remoções de registros ou modificações nas requisições dos serviços.

## Arquivos novos
- src/components/InstitutionalHeader.tsx
- src/components/InstitutionalNav.tsx

## Arquivos alterados
- src/App.tsx
- src/pages/LoginPage.tsx
- src/components/Topbar.tsx
- src/sae/SaeApp.tsx
- src/index.css

## Instalação
1. Faça cópia de segurança do repositório e mantenha a versão publicada funcionando.
2. Substitua os arquivos do frontend pelos deste pacote (não modifique as configurações secretas de implantação).
3. Configure as variáveis de ambiente existentes na hospedagem; não cole service_role keys no frontend.
4. Execute `npm ci`, `npm run lint` e `npm run build` em uma máquina com dependências instaláveis.
5. Teste login RH e SAE, permissões de MASTER e profissional limitado, menus, CRUD, exportações PDF/DOCX, mobile e PWA em ambiente de homologação.
6. Só então publique na produção.

## Limitações e continuidade
- Não foi possível instalar pacotes neste ambiente, portanto não há validação concluída de TypeScript, build ou testes de ponta a ponta.
- O backend e o banco do Supabase não estavam no arquivo enviado. Nenhum dado remoto foi modificado nem validado.
- Formulários e tabelas internas foram preservados, não redesenhados individualmente; o SAE mantém a navegação lateral para não afetar regras existentes.
- O portal usa o logotipo CIAPI fornecido no próprio projeto; marcas oficiais adicionais exigem arquivos autorizados.
