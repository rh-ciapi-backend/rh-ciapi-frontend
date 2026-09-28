[README.md](https://github.com/user-attachments/files/32774539/README.md)
# CIAPI SAE — Módulo TRIAGEM completo

## Conclusão da análise da planilha
O histórico não contém uma norma formal de sequência, mas apresenta um padrão forte:

**Serviço Social → Psicologia → Médico**

Serviço Social e Psicologia podem ocorrer no mesmo dia.

Veja `ANALISE_PLANILHA_TRIAGEM.md` para os números completos.

---

## 1. BANCO — executar primeiro

No Supabase > SQL Editor, execute:

`sql/20260928_sae_triagem.sql`

A migração é aditiva e não altera as tabelas antigas.

---

## 2. BACKEND — criar

Criar:
- `backend/src/routes/saeTriagemRoutes.js`
- `backend/src/services/saeTriagemService.js`

Depois siga exatamente:
- `backend/INTEGRACAO_SERVER.txt`

No Render:
- Manual Deploy
- Deploy latest commit

Se você adicionar o health conforme o arquivo de integração, confirme:
`"saeTriagem": true`

---

## 3. FRONTEND — criar

Criar:
- `src/sae/types/saeTriagem.ts`
- `src/sae/services/saeTriagemService.ts`
- `src/sae/pages/SaeTriagemPage.tsx`
- `src/sae/components/triagem/NovaTriagemModal.tsx`
- `src/sae/components/triagem/TriagemDetalheModal.tsx`

Substituir:
- `src/sae/SaeApp.tsx`

O Sidebar e o Topbar já possuem a aba/título Triagem e não precisam ser alterados.

---

## 4. FUNCIONALIDADES ENTREGUES

### Página Triagem
- KPIs por etapa;
- busca;
- filtro por situação;
- filtro por etapa atual;
- lista responsiva;
- barra de progresso 1 → 2 → 3;
- modal detalhado.

### Nova Triagem
- pessoa nova;
- ou usuário já cadastrado;
- nome;
- sexo;
- nascimento;
- telefone;
- observação inicial.

### Fluxo
1. Serviço Social
2. Psicologia
3. Médico
4. Decisão final

Cada etapa possui:
- status;
- parecer;
- observação;
- data de conclusão;
- possibilidade de reabrir em caso de correção.

### Decisão
Após as três etapas:
- Apto;
- Não apto;
- Desistente.

O sistema não matricula automaticamente.

### Segurança
- tabelas com RLS ligado e sem policies;
- acesso operacional pelo backend/service role;
- usa a mesma permissão `sae_profissionais` que o fluxo atual de agenda, evitando quebrar o sistema de permissões existente.

---

## 5. TESTE RECOMENDADO

1. Criar pessoa em "Nova triagem".
2. Abrir a triagem.
3. Concluir Serviço Social.
4. Concluir Psicologia.
5. Concluir Médico.
6. Confirmar que muda para "Aguardando decisão".
7. Marcar como Apto.
8. Confirmar histórico e filtros.

---

## Melhorias recomendadas depois desta etapa

1. **Agendamento integrado por etapa**
   - botão Agendar dentro de Serviço Social/Psicologia/Médico;
   - reutilizar o calendário inteligente já criado;
   - vincular `agendamento_id` automaticamente à etapa.

2. **Matrícula após APTO**
   - botão "Matricular no Centro-Dia";
   - só aparece para triagem APTO;
   - cria/vincula prontuário com confirmação administrativa.

3. **Documentos obrigatórios**
   - checklist de RG, CPF, Cartão SUS, comprovante, contato do responsável.

4. **Parecer estruturado**
   - formulários específicos por área, em vez de apenas campo de observação.

5. **Pendências**
   - prazo para resolver documento/exame/avaliação complementar;
   - alertas na Topbar.

6. **Indicadores**
   - tempo médio entre entrada e decisão;
   - taxa de aptos/não aptos/desistentes;
   - gargalo por etapa;
   - tempo médio em Serviço Social, Psicologia e Médico.

7. **Importação do legado**
   - criar rotina separada para transformar os registros históricos `TRIAGEM` da planilha/banco em processos de triagem.
   - Recomendo fazer isso somente após validar a tela nova, pois o histórico apresenta registros incompletos e ordens diferentes.
