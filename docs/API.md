# API (api/) - Documentacao ultra detalhada

## Stack

- Node.js + Express
- MySQL/MariaDB (mysql2/promise)
- bcryptjs (hash de senha)
- dotenv (.env)

## Setup rapido

1. cd api
2. npm install
3. copie .env.example para .env
4. npm run dev

## Variaveis de ambiente

- PORT
- HOST
- BODY_LIMIT
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- DB_CONN_LIMIT
- PASSWORD_PEPPER
- BCRYPT_SALT_ROUNDS (nao usado no codigo atual)
- DEFAULT_JOB_POSITION_NAME

---

# Mapa de arquivos (API)

- src/server.js
- src/core/db.js
- src/http/routes/index.js
- src/http/utils/time.js
- src/http/routes/health.js
- src/http/routes/auth.js
- src/http/routes/sync.js
- src/http/routes/sync/pull.js
- src/http/routes/sync/push.js
- src/http/routes/sync/helpers.js

---

# Arquivo por arquivo (detalhe total)

## src/server.js

**Responsabilidade**
- Criar o app Express.
- Configurar body JSON.
- Configurar CORS.
- Registrar rotas.
- Subir o servidor.

**Variaveis**
- `PORT` -> porta (env, default 3000).
- `HOST` -> host (env, default 0.0.0.0).
- `BODY_LIMIT` -> tamanho max do JSON (env, default 10mb).

**Fluxo detalhado**
1) `express()` cria o app.
2) `express.json({ limit: BODY_LIMIT })` habilita payloads grandes.
3) Middleware CORS:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`
   - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
   - `OPTIONS` responde `204` sem corpo.
4) `registerRoutes(app)` monta `/health`, `/auth/login`, `/sync/*`.
5) `app.listen(PORT, HOST)` inicia o servidor.

---

## src/core/db.js

**Responsabilidade**
- Criar pool de conexoes com o banco.

**Variaveis**
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_CONN_LIMIT
- `timezone: 'Z'` (UTC) para padronizar datas.

**Funcoes detalhadas**
- `query(sql, params)`:
  - executa `pool.execute(sql, params)`
  - retorna apenas `rows`.
- `execute(sql, params)`:
  - executa `pool.execute(sql, params)`
  - retorna resultado bruto (rows + metadata).

---

## src/http/routes/index.js

**Responsabilidade**
- Registrar todas as rotas no Express.

**Funcoes**
- `registerRoutes(app)`:
  - `app.use(healthRoutes)`
  - `app.use(authRoutes)`
  - `app.use(syncRoutes)`

---

## src/http/utils/time.js

**Responsabilidade**
- Funcoes auxiliares de tempo.

**Funcoes**
- `nowIso()`:
  - retorna `new Date().toISOString()`.
- `parseSince(value)`:
  - se vazio -> retorna `new Date(0)`
  - se invalido -> retorna `new Date(0)`
  - se valido -> retorna Date parseado

---

## src/http/routes/health.js

**Responsabilidade**
- Health check simples.

**Endpoint**
- `GET /health`

**Resposta**
```json
{ "status": "ok", "serverTime": "..." }
```

---

## src/http/routes/auth.js

**Responsabilidade**
- Login e validacao de senha.

**Variaveis**
- `PASSWORD_PEPPER` -> concatena na senha antes do bcrypt.

**Funcoes internas**
- `isBcryptHash(value)`:
  - valida se hash comeca com `$2`.
- `applyPepper(password)`:
  - concatena `password + PASSWORD_PEPPER`.
- `verifyPassword(password, passwordHash)`:
  - valida formato do hash
  - bcrypt.compare do password+pepper.

**Endpoint**
- `POST /auth/login`

**Fluxo detalhado**
1) valida `username` e `password`.
2) busca usuario em `user_account`.
3) se nao existe -> 401.
4) se `is_active == 0` -> 403.
5) valida senha (bcrypt + pepper).
6) busca `employee_id` ligado a `person_id`.
7) cria token simples `token_${Date.now()}`.
8) retorna token + user + serverTime.

**Observacao**
- O token nao e validado nas rotas de sync (nao ha middleware de auth).

---

## src/http/routes/sync.js

**Responsabilidade**
- Registrar rotas de sync.

**Endpoints**
- `POST /sync/push`
- `GET /sync/pull`

---

## src/http/routes/sync/pull.js

**Responsabilidade**
- Devolver dados incrementais por `updated_at`.

**Funcoes usadas**
- `parseSince()` -> sanitiza `since`.
- `nowIso()` -> serverTime.
- `getUserAccountColumns()` -> detecta se existe `account_type`.

**Fluxo detalhado**
1) calcula `since`.
2) monta SQL de `user_account` com ou sem `account_type`.
3) consulta tabelas:
   - person
   - user_account
   - job_position
   - employee
   - schedule
   - schedule_hour
4) retorna `{ serverTime, data }`.

**Detalhes**
- `schedule_hour` devolve `start_time_minutes` e `end_time_minutes`.
- ordenacao por `updated_at`.

---

## src/http/routes/sync/push.js

**Responsabilidade**
- Processar a Outbox enviada pelo app.

**Variaveis**
- `actions`: array do body.
- `results`: array de respostas.
- `serverTime`: horario do servidor.
- `orderedActions`: actions ordenadas por prioridade.

**Fluxo geral**
1) valida `action.id` e `action.type`.
2) aplica `sortActions()`.
3) executa bloco por tipo.
4) grava `results` com status OK/ERROR.
5) responde `{ results, serverTime }`.

### Acoes suportadas (detalhe total)

#### PERSON_UPSERT
**Obrigatorio**
- `client_id`, `name`, `cpf`.

**Processo**
- resolve `server_id` por `client_id`.
- valida duplicacao por `cpf`.
- UPDATE se `server_id` existe.
- INSERT se nao existir.

**Erros**
- `missing_person_fields`
- `duplicate_cpf`

---

#### USER_ACCOUNT_UPSERT
**Obrigatorio**
- `username`
- referencia de pessoa (`person_server_id` ou `person_client_id`)

**Opcional**
- `password` (obrigatorio no insert)
- `account_type` (EMPLOYEE/ADMIN/BOTH)
- `is_active`

**Processo**
- resolve `person_id`.
- resolve `server_id` do user.
- se update: atualiza username, password_hash (se enviado), account_type, is_active.
- se insert: exige password e cria novo user.

**Erros**
- `missing_user_account_fields`
- `missing_password`

---

#### JOB_POSITION_UPSERT
**Obrigatorio**
- `name`

**Opcional**
- `client_id`
- `description`

**Processo**
- resolve `server_id` por `client_id` (se coluna existir) ou por `name`.
- UPDATE se existir.
- INSERT se nao existir.

---

#### JOB_POSITION_DELETE
**Obrigatorio**
- `job_position_server_id` ou `job_position_client_id` ou `job_position_name`.

**Processo**
- resolve `job_position_id` via helper.
- DELETE direto.

**Erros**
- `job_position_in_use`

---

#### EMPLOYEE_UPSERT
**Obrigatorio**
- `client_id`
- `registration_number`
- referencia de pessoa

**Opcional**
- `job_position_server_id` / `job_position_client_id` / `job_position_name`

**Processo**
- resolve `person_id`.
- resolve `job_position_id`.
- valida duplicacao de matricula.
- UPDATE se existe.
- INSERT se nao existe.
- se cargo faltar -> cria cargo padrao.

**Erros**
- `missing_employee_fields`
- `duplicate_registration`

---

#### SCHEDULE_UPSERT
**Obrigatorio**
- `client_id`
- referencia de employee

**Processo**
- resolve schedule por `client_id`.
- UPDATE se existe.
- INSERT se nao existe.

---

#### SCHEDULE_HOUR_UPSERT
**Obrigatorio**
- `client_id`
- referencia de schedule
- `weekday` (0..6)
- `start_time_minutes`
- `end_time_minutes`

**Processo**
- normaliza weekday e minutos.
- se `block_type=OFF`, start/end = 0.
- resolve `server_id` do horario.
- UPDATE se existe.
- se nao existe, verifica duplicado por schedule+weekday+inicio+fim+tipo.
- se nao duplicado, INSERT.

**Erros**
- `missing_schedule_hour_fields`
- `duplicate_schedule_hour`
- `missing_schedule` (quando schedule nao existe)

---

#### SCHEDULE_HOUR_DELETE_DAY
**Obrigatorio**
- referencia de schedule
- `weekday`

**Processo**
- DELETE FROM schedule_hour WHERE schedule_id + weekday.

---

#### SCHEDULE_HOUR_DELETE
**Obrigatorio**
- `client_id` ou `server_id`

**Processo**
- resolve server_id por client_id se necessario.
- DELETE horario especifico.

---

#### SCHEDULE_HOUR_REPLACE_DAY
**Obrigatorio**
- referencia de schedule
- `weekday`
- `start_time_minutes`
- `end_time_minutes`

**Processo**
1. DELETE horarios do dia.
2. INSERT do novo horario.

---

#### USER_ACCOUNT_DELETE
**Obrigatorio**
- referencia do user (server_id/client_id/username/person_id).

**Processo**
- resolve user_id.
- DELETE user_account.

---

#### EMPLOYEE_DELETE
**Obrigatorio**
- referencia do employee.

**Processo**
- `deleteEmployeeCascade` remove horarios + schedule + employee.

---

#### PERSON_DELETE
**Obrigatorio**
- referencia do person.

**Processo**
- remove employee (cascade)
- remove user_account
- remove person.

---

## src/http/routes/sync/helpers.js

**Responsabilidade**
- Helpers para o push.

**Variaveis**
- `PASSWORD_PEPPER`
- `cachedJobPositionColumns`
- `cachedUserAccountColumns`

**Funcoes detalhadas**

- `applyPepper(password)`:
  - concatena password + pepper.

- `hashPassword(password)`:
  - bcrypt.genSalt(10)
  - bcrypt.hash(password+pepper)

- `ACTION_PRIORITY`:
  - ordem de processamento das actions.

- `sortActions(actions)`:
  - ordena por prioridade
  - desempata por `created_at`.

- `parseWeekday(value)`:
  - valida 0..6
  - converte string/number.

- `parseMinutes(value)`:
  - normaliza 0..1439
  - arredonda.

- `normalizeBool(value, fallback)`:
  - aceita boolean, number, string.

- `resolvePersonId(payload)`:
  - usa `person_server_id`
  - ou busca por `person_client_id`.

- `resolveEmployeeId(payload)`:
  - usa `employee_server_id`
  - ou busca por `employee_client_id`.

- `resolveJobPositionId(payload)`:
  - tenta por `job_position_server_id`
  - tenta por `job_position_id`
  - tenta por `client_id` (se coluna existe)
  - tenta por `job_position_client_id`
  - tenta por `name`/`job_position_name`.

- `getJobPositionColumns()`:
  - `SHOW COLUMNS FROM job_position`
  - cacheia.

- `getUserAccountColumns()`:
  - `SHOW COLUMNS FROM user_account`
  - cacheia.

- `resolveUserAccountId(payload)`:
  - tenta por `server_id`, `user_id`
  - tenta por `client_id`
  - tenta por `username`
  - tenta por `person_id`.

- `ensureDefaultJobPositionId(serverTime)`:
  - cria cargo padrao se nao existir.

- `resolveScheduleId(payload)`:
  - tenta por `schedule_server_id`
  - tenta por `schedule_client_id`.

- `deleteEmployeeCascade(employeeId)`:
  - remove schedule_hour
  - remove schedule
  - remove employee.

---

# Endpoints e exemplos

## GET /health
```json
{ "status": "ok", "serverTime": "2026-02-01T12:00:00.000Z" }
```

---

## POST /auth/login

Request
```json
{ "username": "admin", "password": "SENHA123" }
```

Response
```json
{
  "token": "token_1738432260000",
  "expiresAt": "2026-02-08T12:00:00.000Z",
  "user": { "user_id": 1, "person_id": 10, "employee_id": 5, "username": "admin" },
  "serverTime": "2026-02-01T12:00:00.000Z"
}
```

---

## POST /sync/push

Response (geral)
```json
{
  "serverTime": "2026-02-01T12:00:00.000Z",
  "results": [
    { "id": "uuid-1", "status": "OK", "server_id": 123, "updated_at": "2026-02-01T12:00:00.000Z" }
  ]
}
```

---

## GET /sync/pull

Response
```json
{
  "serverTime": "2026-02-01T12:00:00.000Z",
  "data": {
    "person": [],
    "user_account": [],
    "job_position": [],
    "employee": [],
    "schedule": [],
    "schedule_hour": []
  }
}
```

---

# Observacoes

- A API detecta colunas opcionais com SHOW COLUMNS.
- Pull depende de `updated_at`.
- `weekday` vai de 0 a 6.
- `start_time_minutes` e `end_time_minutes` sao minutos no dia.
- `DEFAULT_JOB_POSITION_NAME` e criado se cargo nao vier.

