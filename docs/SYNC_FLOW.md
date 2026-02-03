# Fluxo de salvar + sincronismo (detalhadissimo)

Este documento descreve, passo a passo, como os dados sao salvos localmente e sincronizados com o servidor. O foco e o fluxo tecnico real: funcoes chamadas, efeitos colaterais, estados e atualizacoes no Realm e no MySQL.

## 1) Principios que guiam o fluxo

### 1.1 Fonte da verdade

- **UI sempre le do Realm**. Nunca espera API para renderizar.
- Portanto, o que aparece na tela e sempre o que ja existe localmente.

### 1.2 Persistencia local primeiro

- Qualquer acao do usuario grava no Realm imediatamente (`realm.write`).
- A sincronizacao apenas replica o que ja foi salvo localmente.

### 1.3 Outbox como fila de envio

- Toda acao que precisa ir ao servidor vira um item de Outbox.
- A Outbox garante que nao exista perda de dados se o dispositivo estiver offline.

### 1.4 Sync em duas fases

- **Push**: envia Outbox para o servidor.
- **Pull**: baixa alteracoes do servidor por `updated_at`.

## 2) Estruturas envolvidas

### 2.1 Realm (local)

- Banco local do app.
- Schemas usados no sync:
  - `Person`, `UserAccount`, `JobPosition`, `Employee`, `Schedule`, `ScheduleHour`.
  - `Outbox` (fila).
  - `AppMeta` (token, lastSyncAt, etc).

### 2.2 MySQL (servidor)

- Tabelas correspondentes no servidor.
- Cada tabela usa `updated_at`.
- `client_id` existe para mapear registros locais.

### 2.3 Campos criticos

- `client_id` (UUID local) -> usado como PK no Realm.
- `server_id` (INT no MySQL) -> recebido no push.
- `updated_at` (servidor) -> usado no pull.
- `sync_status`: `DIRTY`, `CLEAN`, `DELETED`.

## 3) O que acontece quando o usuario salva algo

A regra geral:

1. `realm.write()` grava local.
2. `enqueue()` cria item na Outbox.
3. UI atualiza automaticamente.

### 3.1 Criar pessoa (admin opcional)

- Funcoes:
  - `useManagerActions.handleCreatePerson()`
  - `outboxService.enqueue()`

Passo a passo tecnico:

1. UI chama `handleCreatePerson()`.
2. Valida nome, CPF, matricula e cargo (e credenciais admin se marcado).
3. `realm.write()` cria `Person`.
4. Se for EMPLOYEE, cria `Employee`.
5. `enqueue('PERSON_UPSERT', payload)`.
6. `enqueue('EMPLOYEE_UPSERT', payload)` se necessario.
7. UI renderiza novo usuario porque a lista vem do Realm.

### 3.2 Criar cargo (JobPosition)

- Funcoes:
  - `useManagerActions.handleCreateJobPosition()`

Passo a passo tecnico:

1. UI chama `handleCreateJobPosition()`.
2. Valida nome.
3. `realm.write()` cria `JobPosition`.
4. `enqueue('JOB_POSITION_UPSERT', payload)`.
5. UI exibe o cargo porque esta no Realm.

### 3.3 Criar/editar horario semanal (ScheduleHour)

- Funcoes:
  - `scheduleActions.createScheduleHourForEmployee()` (adiciona faixa)
  - `scheduleActions.updateScheduleHourForEmployee()` (edita faixa)
  - `scheduleActions.updateScheduleDayForEmployee()` (substitui o dia)
  - `scheduleActions.applyDefaultScheduleForEmployee()` (padrao por usuario)
  - `scheduleActions.deleteScheduleHourForEmployee()` (remove faixa)
  - `scheduleActions.deleteScheduleDayForEmployee()` (remove dia)

Passo a passo tecnico (criar faixa):

1. UI chama `createScheduleHourForEmployee()`.
2. Valida weekday e horarios.
3. `getOrCreateScheduleForEmployee()` garante um `Schedule`.
4. Cria `ScheduleHour` local com `sync_status = DIRTY`.
5. `enqueue('SCHEDULE_HOUR_UPSERT', payload)` (append).

Passo a passo tecnico (editar faixa):

1. UI chama `updateScheduleHourForEmployee()`.
2. Valida conflitos.
3. Atualiza `ScheduleHour` local.
4. `enqueue('SCHEDULE_HOUR_UPSERT', payload)`.

Passo a passo tecnico (editar dia inteiro):

1. UI chama `updateScheduleDayForEmployee()`.
2. Marca horarios existentes do dia como DELETED.
3. Cria um novo `ScheduleHour` para o dia.
4. `enqueue('SCHEDULE_HOUR_REPLACE_DAY', payload)`.

Passo a passo tecnico (remover faixa):

1. Marca `ScheduleHour` como DELETED local.
2. `enqueue('SCHEDULE_HOUR_DELETE', payload)`.

Passo a passo tecnico (remover dia):

1. Marca todos `ScheduleHour` do weekday como DELETED.
2. `enqueue('SCHEDULE_HOUR_DELETE_DAY', payload)`.

Observacao (acoes em lote):
- "Adicionar horario em lote" e "Horario padrao em lote" aceitam varias faixas.
- Cada faixa gera um `SCHEDULE_HOUR_UPSERT` separado.

## 4) A fila Outbox

### 4.1 Estrutura

- Schema: `Outbox`.
- Campos principais:
  - `id` (UUID)
  - `type` (acao)
  - `payload_json` (string)
  - `status` (PENDING/SENT/FAILED)

### 4.2 Funcoes

- `enqueue(realm, type, payload)`:
  - cria item `PENDING`.
- `listPending(realm)`:
  - retorna PENDING + FAILED ordenados.
- `markSent(realm, id)` / `markFailed(realm, id, err)`:
  - atualizam status e logs.

## 5) Sync: push (app -> servidor)

### 5.1 Entrada

- Funcoes:
  - `syncService.syncNow()`
  - `pushOutbox()`

### 5.2 Fluxo tecnico

1. `syncNow()` verifica:
   - `API_BASE_URL`.
   - conectividade (NetInfo).
   - concorrencia (`isSyncing`).
2. Chama `pushOutbox()`.
3. `pushOutbox()`:
   - Le Outbox (`listPending`).
   - `parseOutboxPayload()` converte JSON.
   - Ordena por prioridade (`ACTION_PRIORITY`).
   - `fetch POST /sync/push`.
4. Resposta da API:
   - Para cada resultado OK:
     - `markSent()`.
     - `applyPushResult()` -> grava `server_id` e `updated_at`.
     - `applyDeleteResult()` se for delete.
   - Para falhas:
     - `markFailed()` e incrementa retry.

### 5.3 Efeito local

- Registro local passa de DIRTY -> CLEAN.
- `server_id` passa a existir (mapeamento com MySQL).

## 6) API: /sync/push

### 6.1 Router

- `api/src/http/routes/sync.js` encaminha para `sync/push.js`.

### 6.2 Fluxo tecnico do push

- Para cada action:
  1. Resolve IDs (client_id -> server_id).
  2. Executa INSERT ou UPDATE.
  3. Retorna `{ server_id, updated_at }`.

## 7) Sync: pull (servidor -> app)

### 7.1 Entrada

- Funcoes:
  - `pullChanges()`

### 7.2 Fluxo tecnico

1. Le `lastSyncAt` do AppMeta.
2. Aplica overlap de 6h (evita perda por empate de tempo).
3. `fetch GET /sync/pull?since=...`.
4. Para cada entidade:
   - `upsertByServerId()`.

### 7.3 upsertByServerId()

- Para cada registro:
  - se existe local e `sync_status == DIRTY` -> ignora (nao sobrescreve).
  - se existe local e CLEAN -> atualiza.
  - se nao existe -> cria com novo `client_id`.
- Atualiza `local_updated_at`.

### 7.4 Atualiza marcador

- `lastSyncAt = serverTime`.

## 8) API: /sync/pull

### 8.1 Fluxo tecnico

- Recebe `since`.
- Faz SELECT por `updated_at >= since` para cada tabela.
- Retorna dados agregados em `data`.

### 8.2 Efeito no app

- Realm recebe os dados por `upsertByServerId`.
- UI renderiza automaticamente (Realm observado).

## 9) Como o app reage apos um delete no servidor

- Se voce apaga direto no MySQL:
  - o registro some do servidor.
  - o pull nao devolve nada.
  - o app **nao sabe** que deletou.
- Solucoes:
  - deletar via app (enqueue delete).
  - implementar tombstone (`deleted_at`).
  - reset local do Realm.

## 10) Resumo do fluxo end-to-end

1. Usuario cria algo.
2. Realm salva local.
3. Outbox registra acao.
4. Sync push envia para API.
5. API grava no MySQL e retorna server_id.
6. App marca registro como CLEAN.
7. Sync pull baixa alteracoes.
8. UI atualiza automaticamente pelo Realm.

## 11) JSONs reais (exemplos)

### 11.1 Exemplo de item na Outbox (estrutura local)

```json
{
  "id": "1b4c9f20-4d52-4bd5-9b9f-2f2dc2b32c9a",
  "type": "PERSON_UPSERT",
  "payload_json": "{\"client_id\":\"c-123\",\"cpf\":\"00000000000\",\"name\":\"Admin Teste\"}",
  "status": "PENDING",
  "retry_count": 0,
  "created_at_local": "2026-01-25T12:00:00.000Z"
}
```

### 11.2 Request do /sync/push

```json
{
  "clientTime": "2026-01-25T12:00:00.000Z",
  "actions": [
    {
      "id": "1b4c9f20-4d52-4bd5-9b9f-2f2dc2b32c9a",
      "type": "PERSON_UPSERT",
      "payload": {
        "client_id": "c-123",
        "cpf": "00000000000",
        "name": "Admin Teste"
      },
      "created_at": "2026-01-25T12:00:00.000Z"
    }
  ]
}
```

### 11.3 Response do /sync/push

```json
{
  "results": [
    {
      "id": "1b4c9f20-4d52-4bd5-9b9f-2f2dc2b32c9a",
      "status": "OK",
      "server_id": 10,
      "updated_at": "2026-01-25T12:00:01.000Z"
    }
  ],
  "serverTime": "2026-01-25T12:00:01.000Z"
}
```

### 11.4 Request do /sync/pull

```
GET /sync/pull?since=2026-01-25T00:00:00.000Z
```

### 11.5 Response do /sync/pull (recorte)

```json
{
  "serverTime": "2026-01-25T12:05:00.000Z",
  "data": {
    "person": [
      {
        "server_id": 10,
        "cpf": "00000000000",
        "name": "Admin Teste",
        "updated_at": "2026-01-25T12:00:01.000Z"
      }
    ],
    "job_position": [],
    "employee": [],
    "schedule": [],
    "schedule_hour": []
  }
}
```

### 11.6 Payloads de Outbox por tipo

#### PERSON_UPSERT

```json
{
  "client_id": "c-person-1",
  "server_id": 10,
  "cpf": "00000000000",
  "name": "Admin Teste"
}
```

#### USER_ACCOUNT_UPSERT

```json
{
  "client_id": "c-user-1",
  "server_id": 5,
  "person_client_id": "c-person-1",
  "person_server_id": 10,
  "username": "admin",
  "password": "SENHA123",
  "account_type": "BOTH",
  "is_active": true
}
```

#### USER_ACCOUNT_DELETE

```json
{
  "client_id": "c-user-1",
  "server_id": 5,
  "person_client_id": "c-person-1",
  "person_server_id": 10
}
```

#### JOB_POSITION_UPSERT

```json
{
  "client_id": "c-job-1",
  "server_id": 3,
  "name": "Analista",
  "description": "Cargo base"
}
```

#### EMPLOYEE_UPSERT

```json
{
  "client_id": "c-emp-1",
  "server_id": 7,
  "person_client_id": "c-person-1",
  "person_server_id": 10,
  "registration_number": "MAT-001",
  "job_position_client_id": "c-job-1",
  "job_position_server_id": 3
}
```

#### EMPLOYEE_DELETE

```json
{
  "client_id": "c-emp-1",
  "server_id": 7,
  "person_client_id": "c-person-1",
  "person_server_id": 10
}
```

#### PERSON_DELETE

```json
{
  "client_id": "c-person-1",
  "server_id": 10,
  "cpf": "00000000000"
}
```

#### SCHEDULE_UPSERT

```json
{
  "client_id": "c-schedule-1",
  "server_id": 4,
  "employee_client_id": "c-emp-1",
  "employee_server_id": 7,
  "name": "Base"
}
```

#### SCHEDULE_HOUR_UPSERT

```json
{
  "client_id": "c-hour-1",
  "schedule_client_id": "c-schedule-1",
  "schedule_server_id": 4,
  "weekday": 1,
  "start_time_minutes": 480,
  "end_time_minutes": 720,
  "block_type": "WORK",
  "notes": "Faixa 1"
}
```

#### SCHEDULE_HOUR_DELETE

```json
{
  "client_id": "c-hour-1",
  "server_id": 21,
  "schedule_client_id": "c-schedule-1",
  "schedule_server_id": 4,
  "weekday": 1
}
```

#### SCHEDULE_HOUR_REPLACE_DAY

```json
{
  "client_id": "c-hour-1",
  "schedule_client_id": "c-schedule-1",
  "schedule_server_id": 4,
  "weekday": 1,
  "start_time_minutes": 480,
  "end_time_minutes": 1020,
  "block_type": "WORK",
  "notes": "Padrao"
}
```

#### SCHEDULE_HOUR_DELETE_DAY

```json
{
  "schedule_client_id": "c-schedule-1",
  "schedule_server_id": 4,
  "weekday": 1
}
```

