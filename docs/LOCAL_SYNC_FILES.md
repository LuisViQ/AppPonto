# Arquivos de armazenamento local e sincronismo

Este arquivo documenta **cada arquivo** envolvido em:
- persistencia local (Realm)
- fila offline (Outbox)
- sincronismo (push/pull)

---

## 1) Persistencia local (Realm)

### AppPonto/src/databases/realm.ts
- **O que faz:** cria a configuracao do Realm e registra todos os schemas.
- **Por que existe:** centraliza a lista de modelos locais e garante que o Realm abra com as tabelas corretas.
- **Usado por:** `RealmProvider`.

### AppPonto/src/databases/RealmProvider.tsx
- **O que faz:** provedor React que abre o Realm e expõe `useRealm()`.
- **Por que existe:** evita abrir/fechar Realm manualmente em cada tela/servico.
- **Usado por:** telas e services (ex.: Manager, Punch).

### AppPonto/src/databases/schemas/*.ts
- **O que faz:** define os modelos locais (AppMeta, Outbox, Person, Employee, etc).
- **Por que existe:** é o contrato de dados offline-first do app.
- **Observacao:** campos `sync_status`, `local_updated_at` e `server_id` vivem aqui.

### AppPonto/src/services/appMetaService.ts
- **O que faz:** leitura/escrita de metadados (AppMeta) como `lastSyncAt`, `token`.
- **Funcoes principais:** `getMetaValue`, `setMetaValue`, `clearMetaValue`.
- **Usado por:** `syncService` e telas para status de sincronismo.

---

## 2) Outbox (fila offline)

### AppPonto/src/services/outboxService.ts
- **O que faz:** cria e gerencia itens da fila offline.
- **Funcoes principais:**
  - `enqueue()` cria um item PENDING.
  - `listPending()` lista pendencias.
  - `markSent()` / `markFailed()` atualiza status.
- **Usado por:** qualquer fluxo que cria/edita dados offline.

### AppPonto/src/screens/manager/schedule/scheduleActions.ts
- **O que faz:** cria/edita horarios (ScheduleHour) localmente e enfileira Outbox.
- **Exemplos:** `SCHEDULE_UPSERT`, `SCHEDULE_HOUR_UPSERT`, `SCHEDULE_HOUR_REPLACE_DAY`,
  `SCHEDULE_HOUR_DELETE_DAY`, `SCHEDULE_HOUR_DELETE`.

### AppPonto/src/screens/manager/hooks/useManagerActions.ts
- **O que faz:** CRUD de pessoa/funcionario/cargo/usuario local + Outbox.
- **Observacao:** qualquer create/update/delete chama `enqueue()` com o payload.

---

## 3) Sincronismo (push/pull)

### AppPonto/src/services/syncService.ts
- **O que faz:** motor do sync offline-first.
- **Etapas:**
  1. **Push** envia Outbox para API.
  2. **Pull** baixa atualizacoes do servidor via `lastSyncAt`.
  3. **Upsert** no Realm (marca `sync_status = CLEAN`).
  4. Atualiza `lastSyncAt` (hora do servidor).
- **Funcoes principais:**
  - `syncNow()` orquestra tudo.
  - `pushOutbox()` envia fila pendente.
  - `pullChanges()` aplica dados do servidor.

### AppPonto/src/services/http.ts
- **O que faz:** `fetchWithTimeout` para chamadas de rede do sync.
- **Usado por:** `syncService` e `authService`.

---

## 4) Telas que disparam ou exibem status

### AppPonto/src/screens/manager/containers/ManagerContainer.tsx
- **O que faz:** exibe status de sync e chama `syncNow()` no painel admin.
- **Usa:** `AppMeta` para mostrar o ultimo sincronismo.

---

## 5) Dependencias do fluxo

- **Auth**: `AppPonto/src/services/authService.ts` grava token em AppMeta.
- **Schemas**: todos os models com `sync_status` e `server_id` suportam upsert.

---

## Resumo rapido (cadeia de responsabilidade)

1. **UI** grava no Realm (schemas).
2. **Outbox** recebe um item PENDING.
3. **syncService** faz push/pull.
4. **AppMeta** guarda `lastSyncAt` e token.
5. **UI** sempre le do Realm.

