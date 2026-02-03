import Realm from "realm";
import {
  AppMeta,
  Outbox,
  Person,
  UserAccount,
  JobPosition,
  Employee,
  Schedule,
  ScheduleHour,
  Session,
} from "@/src/databases/schemas";
export const getRealm = async () =>
  Realm.open({
    path: "schedule_db",
    schemaVersion: 7,
    migration: (oldRealm, newRealm) => {
      if (oldRealm.schemaVersion < 2) {
        const oldHours = oldRealm.objects("ScheduleHour");
        const newHours = newRealm.objects("ScheduleHour");
        for (let i = 0; i < oldHours.length; i += 1) {
          const oldItem = oldHours[i] as unknown as { work_date?: Date };
          const newItem = newHours[i] as unknown as { weekday?: number };
          if (oldItem.work_date instanceof Date) {
            newItem.weekday = oldItem.work_date.getDay();
          } else if (newItem.weekday === undefined) {
            newItem.weekday = 1;
          }
        }
      }
    },
    schema: [
      AppMeta,
      Outbox,
      Person,
      UserAccount,
      JobPosition,
      Employee,
      Schedule,
      ScheduleHour,
      Session,
    ],
  });
