import Realm from 'realm';

export class UserAccount extends Realm.Object<UserAccount> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  person_server_id?: Realm.Types.Int;
  person_client_id?: string;
  username!: string;
  account_type?: string;
  is_active!: boolean;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
