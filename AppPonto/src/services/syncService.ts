import NetInfo from "@react-native-community/netinfo";
import type Realm from "realm";

import { getMetaValue, META_KEYS } from "@/src/services/appMetaService";
import { fetchWithTimeout } from "@/src/services/http";
import { API_BASE_URL } from "./sync/constants";
import { pushOutbox } from "./sync/push";
import { pullChanges } from "./sync/pull";
import type { SyncResult } from "./sync/types";

let isSyncing = false;

export async function syncNow(realm: Realm): Promise<SyncResult> {
  if (isSyncing) {
    return { status: "skipped", reason: "busy" };
  }

  if (!API_BASE_URL) {
    return { status: "skipped", reason: "missing_base_url" };
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected || netState.isInternetReachable === false) {
    return { status: "skipped", reason: "offline" };
  }

  const token = getMetaValue(realm, META_KEYS.authToken);

  isSyncing = true;
  try {
    const health = await fetchWithTimeout(`${API_BASE_URL}/health`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!health.ok) {
      throw new Error(`API indisponivel (${health.status})`);
    }

    const pushResult = await pushOutbox(realm, token);
    const pulled = await pullChanges(realm, token);
    return {
      status: "ok",
      pushed: pushResult.pushed,
      pulled,
      warnings: pushResult.warnings.length ? pushResult.warnings : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", error: message };
  } finally {
    isSyncing = false;
  }
}