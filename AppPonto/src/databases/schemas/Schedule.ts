import Realm from 'realm';

export class Schedule extends Realm.Object<Schedule> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  employee_server_id?: Realm.Types.Int;
  employee_client_id?: string;
  name?: string;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
