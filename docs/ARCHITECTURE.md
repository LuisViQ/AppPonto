# Arquitetura

## Visao geral
O projeto e offline-first: a UI sempre le o Realm e nunca espera API para renderizar.
Todas as acoes do usuario gravam no Realm e geram um item na Outbox. A sincronizacao
faz push (envia Outbox) e depois pull (baixa mudancas do servidor por updated_at).

Fluxo resumido:
1) Usuario faz uma acao (ex: criar horario).
2) App grava no Realm imediatamente (sync_status = DIRTY).
3) App grava um item na Outbox (status = PENDING).
4) Sync push envia Outbox para a API.
5) API grava no MySQL e responde server_id + updated_at.
6) App marca o registro local como CLEAN e salva server_id.
7) Sync pull baixa alteracoes do MySQL desde lastSyncAt.
8) App faz upsert no Realm (sem sobrescrever registros DIRTY).

## Regras offline-first (ouro)
- UI sempre le do Realm.
- Acoes gravam no Realm imediatamente.
- Outbox guarda o que precisa ir ao servidor.
- Sync e bidirecional (push -> pull).
- lastSyncAt sempre vem do servidor (serverTime).
- Operacoes devem ser idempotentes (reenvio nao duplica).

## Pipeline de sync
### Fase A: checagens
- Verifica se a API base esta configurada.
- Verifica conectividade (NetInfo).
- Evita rodar duas sincronizacoes ao mesmo tempo.

### Fase B: PUSH
- Lista Outbox PENDING/FAILED.
- Ordena por prioridade (PERSON -> JOB_POSITION -> EMPLOYEE -> SCHEDULE -> SCHEDULE_HOUR -> TIME_CLOCK_EVENT).
- Envia batch para /sync/push.
- Marca cada item como SENT ou FAILED.

### Fase C: PULL
- Envia /sync/pull?since=lastSyncAt.
- Faz upsert por server_id nas entidades.
- Atualiza lastSyncAt com serverTime do servidor.

## Idempotencia
- Cada registro local tem client_id (UUID).
- Para TIME_CLOCK_EVENT, o app envia client_event_id.
- O servidor deve tratar client_event_id como UNIQUE.
- Se reenvia, o servidor retorna o mesmo server_id (sem duplicar).

## Conflitos
- A estrategia atual prioriza o servidor quando um registro remoto chega.
- Registros locais com sync_status = DIRTY nao sao sobrescritos no pull.

## Onde acontece
- App: Realm + Outbox + syncService.
- API: /sync/push e /sync/pull.
- MySQL: updated_at e triggers para propagar mudancas.
