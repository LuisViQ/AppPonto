import Realm from 'realm';

export class Person extends Realm.Object<Person> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  cpf!: string;
  name!: string;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
