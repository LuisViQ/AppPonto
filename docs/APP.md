# 1. Visao Geral do Sistema

O **AppPonto** e um aplicativo de gestao de pessoas, funcionarios e horarios semanais.

O sistema segue o modelo **offline-first**, armazenando todos os dados localmente no **Realm** e realizando sincronizacao com a API sempre que houver conectividade.

### Funcionalidades principais

- Login administrativo
- Cadastro de pessoas
- Vinculacao de pessoa como funcionario
- Gestao de cargos
- Controle de acesso administrativo (`UserAccount`)
- Horarios semanais por dia da semana
- Acoes em lote
- Sincronizacao push e pull

---

# 2. Stack e Tecnologias

## Front-end

- React Native com Expo
- UI: Gluestack UI
- Estilos: NativeWind
- Persistencia local: Realm

## Back-end

- Node.js + Express
- Banco de dados MySQL / MariaDB

---

# 3. Fluxo de Inicializacao do App (Boot)

### Arquivos envolvidos

- `index.ts`
- `App.tsx`
- `RealmProvider.tsx`
- `realm.ts`
- `syncWorker.ts`

### Sequencia

1. `index.ts` registra o aplicativo.
2. `App.tsx` monta os providers globais:
   - `SafeAreaProvider`
   - `GluestackUIProvider`
   - `RealmProvider`
3. `RealmProvider` abre o banco local via `realm.ts`.
4. `AppContent` le `AppMeta.auth_token`.
5. Se existir token, abre `ManagerScreen`.
6. Caso contrario, abre `LoginScreen`.
7. `useSyncWorker` dispara sincronizacao automatica (quando logado).

---

# 4. Persistencia Local (Realm)

### Schemas utilizados

- `AppMeta` — estado da sessao (token, usuario, sync)
- `Outbox` — fila offline
- `Person`
- `UserAccount`
- `JobPosition`
- `Employee`
- `Schedule`
- `ScheduleHour`

### Padrao Offline-First

- Toda acao grava imediatamente no Realm
- Toda acao gera um registro na Outbox
- A interface sempre renderiza dados do Realm

---

# 5. Navegacao e Estrutura de Telas

### Arquivos principais

- `ManagerScreen.tsx`
- `manager/containers/ManagerContainer.tsx`
- `manager/layout/ManagerLayout.tsx`

### Tabs principais (bottom bar)

- Home
- Criar
- Usuarios

### Modos de visualizacao

- Listagem
- Detalhe
- Criacao
- Busca

---

# 6. Login

### Arquivos envolvidos

- `LoginScreen.tsx`
- `authService.ts`
- `http.ts`
- `appMetaService.ts`

### Fluxo

1. O usuario informa login e senha.
2. `authService.login` executa `POST /auth/login`.
3. Em caso de sucesso:
   - Grava `auth_token`
   - Grava `user_server_id`
   - Grava `username`
4. O app navega para o `Manager`.

---

# 7. Fluxo de Criacao de Usuario

### Arquivos envolvidos

- `manager/views/ManagerCreatePersonView.tsx`
- `manager/hooks/useManagerActions.ts`

### Validacoes

- Nome obrigatorio
- CPF obrigatorio e unico
- Matricula obrigatoria e unica (se funcionario)
- Cargo obrigatorio (se funcionario)
- Admin exige `username` e `password`

### Persistencia

- Criacao de `Person` no Realm
- Criacao de `Employee` (se funcionario)
- Geracao de Outbox:
  - `PERSON_UPSERT`
  - `EMPLOYEE_UPSERT`
- Se admin:
  - Cria `UserAccount`
  - `account_type = ADMIN` ou `BOTH`
  - Outbox: `USER_ACCOUNT_UPSERT`

---

# 8. Fluxo de Cargos

### Arquivos envolvidos

- `manager/views/ManagerCreateJobPositionView.tsx`
- `manager/hooks/useManagerActions.ts`

### Validacoes

- Nome obrigatorio
- Nome unico (normalizado)

### Acoes

- Criar cargo ? `JOB_POSITION_UPSERT`
- Editar cargo ? `JOB_POSITION_UPSERT`
- Excluir cargo:
  - Bloqueado se estiver em uso
  - Outbox: `JOB_POSITION_DELETE`

---

# 9. Usuarios e Listagem

### Arquivos envolvidos

- `manager/views/ManagerUsersListView.tsx`
- `manager/hooks/useEmployeeDirectory.ts`
- `manager/utils/directoryUtils.ts`
- `manager/list/*`

### Estruturas geradas

- `userRows`
- `filteredUserRows`
- `employeeRows`

### Filtros disponiveis

- Busca por nome ou CPF
- Tipo de conta (`ADMIN`, `EMPLOYEE`, `ALL`)
- Cargo

---

# 10. Detalhe do Usuario

### Arquivos envolvidos

- `manager/views/ManagerDetailView.tsx`
- `manager/detail/*`

### Blocos da tela

- Dados do usuario (nome e CPF)
- Funcionario (matricula e cargo)
- Acesso administrativo (login e senha)
- Horarios semanais

---

# 11. Acesso Administrativo (Admin)

### Campos

- `username`
- `password`
- `account_type` (`ADMIN`, `EMPLOYEE`, `BOTH`)
- `is_active`

### Regras

- Se admin estiver ativo, login e senha sao obrigatorios
- O usuario nao pode remover o proprio acesso

---

# 12. Horarios Semanais

### Arquivos envolvidos

- `manager/schedule/scheduleActions.ts`
- `manager/schedule/managerScheduleHandlers.ts`
- `manager/schedule/scheduleHelpers.ts`
- `manager/detail/DetailScheduleView.tsx`

### Modelo

- Horarios organizados por `weekday` (0 a 6)
- Multiplas faixas no mesmo dia

### Acoes disponiveis

- Adicionar faixa
- Editar faixa
- Substituir dia inteiro
- Remover faixa
- Remover dia

### Regras

- Nao permite horarios duplicados no mesmo dia
- Nao permite horario invalido (inicio maior ou igual ao fim)

---

# 13. Acoes em Lote

### Arquivos envolvidos

- `manager/views/ManagerUsersBulkView.tsx`
- `manager/schedule/scheduleActions.ts`

### Funcionalidades

- Aplicar horarios para todos os usuarios do filtro
- Aplicar horario padrao semanal

### Feedback visual

- Sucesso: verde
- Erro: vermelho

---

# 14. Outbox (Fila Offline)

### Arquivo

- `outboxService.ts`

### Estrutura

- `id`
- `type`
- `payload_json`
- `status` (`PENDING`, `FAILED`, `SENT`)
- `retry_count`

### Regras

- Toda acao CRUD gera um item na Outbox
- O push processa acoes em lote

---

# 15. Sincronizacao

### Arquivos envolvidos

- `syncService.ts`
- `services/sync/push.ts`
- `services/sync/pull.ts`
- `services/sync/constants.ts`

### Sequencia

1. `syncNow()` verifica:
   - API base configurada
   - Conectividade com a internet
   - Endpoint `/health`
2. Push:
   - Envia Outbox
   - Marca acoes como `SENT` ou `FAILED`
3. Pull:
   - Baixa dados por `updated_at`
   - Aplica alteracoes no Realm

---

# 16. Controle de Sessao

### Arquivo

- `appMetaService.ts`

### Chaves armazenadas

- `auth_token`
- `user_server_id`
- `employee_server_id`
- `username`
- `last_sync_at`

---

# 17. Regras de Negocio Principais

- CPF nao pode se repetir
- Matricula nao pode se repetir
- Nome de cargo nao pode se repetir
- Uma pessoa so pode virar funcionario uma vez
- Acesso admin so existe via `UserAccount`
- Nao e permitido excluir o proprio usuario

---

# 18. Erros e Feedbacks

### Feedback visual

- Erro: mensagem em vermelho
- Sucesso: indicacao verde temporaria

### Sincronizacao

- `skipped`: sem rede ou API base
- `error`: falha no health, push ou pull

---

# 19. Mapa Rapido de Arquivos

### Autenticacao

- `authService.ts`
- `LoginScreen.tsx`

### Dados locais

- `realm.ts`
- `schemas/*`
- `outboxService.ts`

### Sincronizacao

- `syncService.ts`
- `services/sync/push.ts`
- `services/sync/pull.ts`

### Regras de horario

- `manager/schedule/scheduleActions.ts`

### UI principal

- `manager/containers/ManagerContainer.tsx`
- `manager/layout/ManagerLayout.tsx`
