import type Realm from "realm";

import { listPending, markFailed, markSent } from "@/src/services/outboxService";
import { fetchWithTimeout } from "@/src/services/http";
import type { Outbox } from "@/src/databases/schemas";
import {
  ACTION_PRIORITY,
  ACTION_SCHEMA,
  API_BASE_URL,
  DELETE_SCHEMA,
  PUSH_BATCH_SIZE,
  PUSH_ERROR_MESSAGES,
} from "./constants";
import type { PendingAction } from "./types";

function mapOutboxPayload(_type: string, payload: unknown) {
  return payload;
}

function formatPushError(error?: string) {
  if (!error) {
    return "Erro ao sincronizar";
  }
  if (PUSH_ERROR_MESSAGES[error]) {
    return PUSH_ERROR_MESSAGES[error];
  }
  return error;
}

function parseOutboxPayload(payloadJson: string) {
  try {
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function applyPushResult(
  realm: Realm,
  action: PendingAction,
  result: { server_id?: number; updated_at?: string },
) {
  const schemaName = ACTION_SCHEMA[action.type];
  if (!schemaName) {
    return;
  }
  const clientId =
    (action.payload.client_id as string | undefined) ||
    (action.payload.client_event_id as string | undefined);
  if (!clientId) {
    return;
  }

  const serverId =
    result.server_id !== undefined && result.server_id !== null
      ? Number(result.server_id)
      : undefined;
  const updatedAt = result.updated_at ? new Date(result.updated_at) : undefined;

  realm.write(() => {
    const record = realm.objectForPrimaryKey(schemaName, clientId) as
      | (Record<string, unknown> & { server_id?: number; updated_at?: Date })
      | undefined;
    if (!record) {
      return;
    }
    if (serverId && !record.server_id) {
      record.server_id = serverId as never;
    }
    if (updatedAt) {
      record.updated_at = updatedAt as never;
    }
    record.local_updated_at = new Date() as never;
    record.sync_status = "CLEAN" as never;
  });
}

function applyDeleteResult(realm: Realm, action: PendingAction) {
  const schemaName = DELETE_SCHEMA[action.type];
  if (!schemaName) {
    return;
  }
  const clientId = action.payload.client_id as string | undefined;
  const serverId = action.payload.server_id as number | undefined;
  realm.write(() => {
    if (clientId) {
      const record = realm.objectForPrimaryKey(schemaName, clientId);
      if (record) {
        realm.delete(record);
        return;
      }
    }
    if (serverId) {
      const record = realm
        .objects(schemaName)
        .filtered("server_id == $0", serverId)[0];
      if (record) {
        realm.delete(record);
      }
    }
  });
}

export async function pushOutbox(realm: Realm, token: string | null) {
  const pending = listPending(realm) as unknown as Outbox[];
  if (pending.length === 0) {
    return { pushed: 0, warnings: [] as string[] };
  }

  const actions: PendingAction[] = [];
  const actionById = new Map<string, PendingAction>();
  for (const item of pending) {
    const parsed = parseOutboxPayload(item.payload_json);
    if (!parsed) {
      markFailed(realm, item.id, "payload_json_invalid");
      continue;
    }
    const payload = mapOutboxPayload(item.type, parsed);
    const action: PendingAction = {
      id: item.id,
      type: item.type,
      payload,
      created_at: item.created_at_local?.toISOString(),
    };
    actions.push(action);
    actionById.set(action.id, action);
  }

  if (actions.length === 0) {
    return { pushed: 0, warnings: [] as string[] };
  }

  actions.sort((a, b) => {
    const priorityA = ACTION_PRIORITY[a.type] ?? 99;
    const priorityB = ACTION_PRIORITY[b.type] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });

  let pushed = 0;
  const warnings: string[] = [];
  for (let start = 0; start < actions.length; start += PUSH_BATCH_SIZE) {
    const batch = actions.slice(start, start + PUSH_BATCH_SIZE);
    const response = await fetchWithTimeout(`${API_BASE_URL}/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        clientTime: new Date().toISOString(),
        actions: batch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        id: string;
        status: "OK" | "ERROR";
        server_id?: number;
        updated_at?: string;
        error?: string;
      }>;
      serverTime?: string;
    };

    for (const result of payload.results ?? []) {
      if (result.status === "OK") {
        markSent(realm, result.id);
        const action = actionById.get(result.id);
        if (action) {
          applyPushResult(realm, action, result);
          applyDeleteResult(realm, action);
        }
        pushed += 1;
      } else {
        if (result.error === "duplicate_schedule_hour") {
          const action = actionById.get(result.id);
          if (action?.payload?.client_id) {
            realm.write(() => {
              const record = realm.objectForPrimaryKey(
                "ScheduleHour",
                action.payload.client_id as string,
              );
              if (record) {
                realm.delete(record);
              }
            });
          }
          markSent(realm, result.id);
          warnings.push(formatPushError(result.error));
          continue;
        }
        const friendly = formatPushError(result.error);
        markFailed(realm, result.id, friendly);
        if (friendly) {
          warnings.push(friendly);
        }
      }
    }
  }

  return { pushed, warnings: Array.from(new Set(warnings)) };
}