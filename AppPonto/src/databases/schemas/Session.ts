import Realm from 'realm';

export class Session extends Realm.Object<Session> {
  id!: string;
  token!: string;
  user_server_id?: Realm.Types.Int;
  employee_client_id?: string;
  expires_at?: Date;
  updated_at_local!: Date;

  static primaryKey = 'id';
}
