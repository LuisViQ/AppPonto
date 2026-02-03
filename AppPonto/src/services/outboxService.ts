import type Realm from 'realm';

import { Outbox } from '@/src/databases/schemas';
import { uuid } from '@/src/utils/uuid';

export type OutboxStatus = 'PENDING' | 'SENT' | 'FAILED';

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function enqueue(realm: Realm, type: string, payload: unknown): string {
  const id = uuid();
  const now = new Date();

  const create = () => {
    realm.create<Outbox>('Outbox', {
      id,
      type,
      payload_json: JSON.stringify(payload ?? {}),
      status: 'PENDING',
      retry_count: 0,
      created_at_local: now,
    });
  };

  if (realm.isInTransaction) {
    create();
  } else {
    realm.write(create);
  }

  return id;
}

export function listPending(realm: Realm) {
  return realm
    .objects<Outbox>('Outbox')
    .filtered('status == "PENDING" OR status == "FAILED"')
    .sorted('created_at_local', true);
}

export function markSent(realm: Realm, id: string) {
  realm.write(() => {
    const item = realm.objectForPrimaryKey<Outbox>('Outbox', id);
    if (!item) {
      return;
    }
    item.status = 'SENT';
    item.last_error = undefined;
    item.last_try_at = new Date();
  });
}

export function markFailed(realm: Realm, id: string, error: unknown) {
  realm.write(() => {
    const item = realm.objectForPrimaryKey<Outbox>('Outbox', id);
    if (!item) {
      return;
    }
    item.status = 'FAILED';
    item.last_error = stringifyError(error);
    item.last_try_at = new Date();
    item.retry_count = (item.retry_count ?? 0) + 1;
  });
}
