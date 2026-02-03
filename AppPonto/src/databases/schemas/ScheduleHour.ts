import Realm from 'realm';

export class ScheduleHour extends Realm.Object<ScheduleHour> {
  client_id!: string;
  server_id?: Realm.Types.Int;
  schedule_server_id?: Realm.Types.Int;
  schedule_client_id?: string;
  weekday!: Realm.Types.Int;
  start_time_minutes!: Realm.Types.Int;
  end_time_minutes!: Realm.Types.Int;
  block_type?: string;
  notes?: string;
  updated_at?: Date;
  local_updated_at!: Date;
  sync_status!: string;

  static primaryKey = 'client_id';
}
