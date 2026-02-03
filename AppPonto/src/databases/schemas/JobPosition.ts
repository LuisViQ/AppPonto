import Realm from 'realm';

export class JobPosition extends Realm.Object<JobPosition> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  name!: string;
  description?: string;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
