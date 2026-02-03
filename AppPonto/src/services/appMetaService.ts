import type Realm from 'realm';

import { AppMeta } from '@/src/databases/schemas';

export const META_KEYS = {
  authToken: 'auth_token',
  lastSyncAt: 'last_sync_at',
  employeeServerId: 'employee_server_id',
  userServerId: 'user_server_id',
  username: 'username',
};

export function getMetaValue(realm: Realm, key: string): string | null {
  const item = realm.objectForPrimaryKey<AppMeta>('AppMeta', key);
  return item?.value ?? null;
}

export function getMetaNumber(realm: Realm, key: string): number | null {
  const value = getMetaValue(realm, key);
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function setMetaValue(realm: Realm, key: string, value: string) {
  const now = new Date();
  realm.write(() => {
    const item = realm.objectForPrimaryKey<AppMeta>('AppMeta', key);
    if (item) {
      item.value = value;
      item.updated_at_local = now;
      return;
    }
    realm.create<AppMeta>('AppMeta', {
      key,
      value,
      updated_at_local: now,
    });
  });
}

export function clearMetaValue(realm: Realm, key: string) {
  realm.write(() => {
    const item = realm.objectForPrimaryKey<AppMeta>('AppMeta', key);
    if (item) {
      realm.delete(item);
    }
  });
}
