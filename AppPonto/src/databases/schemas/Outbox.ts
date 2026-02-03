import Realm, { index } from "realm";

export class Outbox extends Realm.Object<Outbox> {
  id!: string;
  type!: string;
  payload_json!: string;
  @index
  status!: string;
  retry_count!: Realm.Types.Int;
  last_error?: string;
  created_at_local!: Date;
  last_try_at?: Date;

  static primaryKey = "id";
}
