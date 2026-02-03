import Realm from 'realm';

export class Employee extends Realm.Object<Employee> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  person_server_id?: Realm.Types.Int;
  person_client_id?: string;
  registration_number!: string;
  job_position_server_id?: Realm.Types.Int;
  job_position_client_id?: string;
  person_name_cache?: string;
  job_position_name_cache?: string;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
