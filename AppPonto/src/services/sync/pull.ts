import type Realm from "realm";

import { getMetaValue, META_KEYS, setMetaValue } from "@/src/services/appMetaService";
import { fetchWithTimeout } from "@/src/services/http";
import { uuid } from "@/src/utils/uuid";
import { API_BASE_URL, PULL_BATCH_SIZE, PULL_YIELD_MS } from "./constants";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeRecord(
  record: Record<string, unknown>,
  dateFields: string[],
  booleanFields: string[] = [],
  numberFields: string[] = [],
) {
  const normalized: Record<string, unknown> = { ...record };
  if (normalized.server_id !== undefined && normalized.server_id !== null) {
    normalized.server_id = Number(normalized.server_id);
  }

  for (const field of dateFields) {
    const value = normalized[field];
    if (typeof value === "string" || typeof value === "number") {
      normalized[field] = new Date(value);
    }
  }

  for (const field of booleanFields) {
    const value = normalized[field];
    if (typeof value === "boolean") {
      continue;
    }
    if (typeof value === "number") {
      normalized[field] = value !== 0;
      continue;
    }
    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === "1" || normalizedValue === "true") {
        normalized[field] = true;
        continue;
      }
      if (normalizedValue === "0" || normalizedValue === "false") {
        normalized[field] = false;
        continue;
      }
    }
  }

  for (const field of numberFields) {
    const value = normalized[field];
    if (value === undefined || value === null) {
      continue;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      normalized[field] = parsed;
    }
  }

  return normalized;
}

function cleanupDuplicateScheduleHours(realm: Realm) {
  const all = realm
    .objects("ScheduleHour")
    .filtered('sync_status != "DELETED"');
  const groups = new Map<string, Realm.Object[]>();

  for (const item of all) {
    if (item.isValid && !item.isValid()) {
      continue;
    }
    const scheduleServerId = (item as Record<string, unknown>)
      .schedule_server_id as number | undefined;
    const scheduleClientId = (item as Record<string, unknown>)
      .schedule_client_id as string | undefined;
    const weekday = (item as Record<string, unknown>).weekday as
      | number
      | undefined;
    const startMinutes = (item as Record<string, unknown>)
      .start_time_minutes as number | undefined;
    const endMinutes = (item as Record<string, unknown>).end_time_minutes as
      | number
      | undefined;
    const blockType =
      ((item as Record<string, unknown>).block_type as string | undefined) ??
      "WORK";

    if (
      weekday === undefined ||
      startMinutes === undefined ||
      endMinutes === undefined
    ) {
      continue;
    }

    const scheduleKey = scheduleServerId
      ? `s:${scheduleServerId}`
      : scheduleClientId
        ? `c:${scheduleClientId}`
        : null;
    if (!scheduleKey) {
      continue;
    }
    const key = `${scheduleKey}|${weekday}|${startMinutes}|${endMinutes}|${blockType}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  realm.write(() => {
    for (const bucket of groups.values()) {
      if (bucket.length <= 1) {
        continue;
      }
      let keep = bucket[0];
      for (const candidate of bucket) {
        const candidateServerId = (candidate as Record<string, unknown>)
          .server_id as number | undefined;
        const keepServerId = (keep as Record<string, unknown>).server_id as
          | number
          | undefined;
        if (candidateServerId && !keepServerId) {
          keep = candidate;
        }
      }
      for (const candidate of bucket) {
        if (candidate !== keep) {
          realm.delete(candidate);
        }
      }
    }
  });
}

async function upsertByServerId(
  realm: Realm,
  schemaName: string,
  records: Array<Record<string, unknown>>,
  dateFields: string[] = [],
  booleanFields: string[] = [],
  numberFields: string[] = [],
) {
  const now = new Date();
  let count = 0;

  const chunkSize = Math.max(1, Math.min(PULL_BATCH_SIZE, records.length));
  for (let start = 0; start < records.length; start += chunkSize) {
    const chunk = records.slice(start, start + chunkSize);
    realm.write(() => {
      for (const record of chunk) {
        const normalized = normalizeRecord(
          record,
          dateFields,
          booleanFields,
          numberFields,
        );
        const serverId = normalized.server_id as number | undefined;
        if (!serverId) {
          continue;
        }

        const existing = realm
          .objects(schemaName)
          .filtered("server_id == $0", serverId)[0] as
          | (Record<string, unknown> & { client_id?: string })
          | undefined;

        if (existing) {
          if (existing.sync_status === "DIRTY") {
            continue;
          }
          for (const [key, value] of Object.entries(normalized)) {
            if (key in existing) {
              existing[key] = value as never;
            }
          }
          existing.local_updated_at = now as never;
          existing.sync_status = "CLEAN" as never;
        } else {
          realm.create(schemaName, {
            ...normalized,
            client_id: uuid(),
            local_updated_at: now,
            sync_status: "CLEAN",
          });
        }

        count += 1;
      }
    });
    if (start + chunkSize < records.length) {
      await delay(PULL_YIELD_MS);
    }
  }

  return count;
}

export async function pullChanges(realm: Realm, token: string | null) {
  const overlapMs = 6 * 60 * 60 * 1000;
  const sinceRaw = getMetaValue(realm, META_KEYS.lastSyncAt);
  let sinceDate = sinceRaw ? new Date(sinceRaw) : new Date(0);
  if (Number.isNaN(sinceDate.getTime())) {
    sinceDate = new Date(0);
  }
  if (sinceRaw) {
    sinceDate = new Date(sinceDate.getTime() - overlapMs);
  }
  const since = sinceDate.toISOString();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/sync/pull?since=${encodeURIComponent(since)}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Pull failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    serverTime: string;
    data: Record<string, Array<Record<string, unknown>>>;
  };

  const data = payload.data ?? {};
  let pulled = 0;

  pulled += await upsertByServerId(realm, "Person", data.person ?? [], [
    "updated_at",
  ]);
  pulled += await upsertByServerId(
    realm,
    "UserAccount",
    data.user_account ?? [],
    ["updated_at"],
    ["is_active"],
  );
  pulled += await upsertByServerId(
    realm,
    "JobPosition",
    data.job_position ?? [],
    ["updated_at"],
  );
  pulled += await upsertByServerId(
    realm,
    "Employee",
    data.employee ?? [],
    ["updated_at"],
  );
  pulled += await upsertByServerId(realm, "Schedule", data.schedule ?? [], [
    "updated_at",
  ]);
  pulled += await upsertByServerId(
    realm,
    "ScheduleHour",
    data.schedule_hour ?? [],
    ["updated_at"],
    [],
    ["weekday", "start_time_minutes", "end_time_minutes"],
  );
  cleanupDuplicateScheduleHours(realm);
  if (payload.serverTime) {
    setMetaValue(realm, META_KEYS.lastSyncAt, payload.serverTime);
  }

  return pulled;
}
