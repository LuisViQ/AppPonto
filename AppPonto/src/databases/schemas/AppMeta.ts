import Realm from 'realm';

export class AppMeta extends Realm.Object<AppMeta> {
  key!: string;
  value!: string;
  updated_at_local!: Date;

  static primaryKey = 'key';
}
