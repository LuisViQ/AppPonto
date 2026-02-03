import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type Realm from 'realm';

import { syncNow } from '@/src/services/syncService';

type SyncWorkerOptions = {
  enabled?: boolean;
  intervalMs?: number;
};

export function useSyncWorker(
  realm: Realm,
  { enabled = true, intervalMs = 60000 }: SyncWorkerOptions = {},
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const triggerSync = () => {
      if (!active) {
        return;
      }
      void syncNow(realm);
    };

    triggerSync();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!active) {
        return;
      }
      if (state.isConnected && state.isInternetReachable !== false) {
        triggerSync();
      }
    });

    const intervalId = setInterval(() => {
      triggerSync();
    }, intervalMs);

    return () => {
      active = false;
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [realm, enabled, intervalMs]);
}
