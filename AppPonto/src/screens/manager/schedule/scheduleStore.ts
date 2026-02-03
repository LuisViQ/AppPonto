import type Realm from "realm";

import type { Employee, Schedule, ScheduleHour } from "@/src/databases/schemas";
import { enqueue } from "@/src/services/outboxService";
import { uuid } from "@/src/utils/uuid";
import type { Weekday } from "../utils/constants";

export function getOrCreateScheduleForEmployee(
  realm: Realm,
  employee: Employee,
): Schedule {
  const existing = realm
    .objects<Schedule>("Schedule")
    .filtered(
      "employee_client_id == $0 OR employee_server_id == $1",
      employee.client_id,
      employee.server_id ?? -1,
    )[0];
  if (existing) {
    return existing;
  }

  let created: Schedule | null = null;
  const create = () => {
    const scheduleClientId = uuid();
    created = realm.create<Schedule>("Schedule", {
      client_id: scheduleClientId,
      employee_client_id: employee.client_id,
      employee_server_id: employee.server_id,
      name: "Base",
      local_updated_at: new Date(),
      sync_status: "DIRTY",
    });
    enqueue(realm, "SCHEDULE_UPSERT", {
      client_id: scheduleClientId,
      employee_client_id: employee.client_id,
      employee_server_id: employee.server_id,
      name: "Base",
    });
  };

  if (realm.isInTransaction) {
    create();
  } else {
    realm.write(create);
  }

  return created as Schedule;
}

export function listSchedulesForEmployee(realm: Realm, employee: Employee) {
  const schedules = realm
    .objects<Schedule>("Schedule")
    .filtered(
      "employee_client_id == $0 OR employee_server_id == $1",
      employee.client_id,
      employee.server_id ?? -1,
    );
  return Array.from(schedules).filter((schedule) =>
    schedule?.isValid ? schedule.isValid() : true,
  );
}

export function listScheduleHoursForDay(
  realm: Realm,
  schedule: Schedule,
  weekday: Weekday,
) {
  return realm
    .objects<ScheduleHour>("ScheduleHour")
    .filtered(
      'weekday == $0 && (schedule_client_id == $1 || schedule_server_id == $2) && sync_status != "DELETED"',
      weekday,
      schedule.client_id,
      schedule.server_id ?? -1,
    );
}

export function listScheduleHoursForEmployeeDay(
  realm: Realm,
  employee: Employee,
  weekday: Weekday,
) {
  const schedules = listSchedulesForEmployee(realm, employee);

  if (schedules.length === 0) {
    return [] as ScheduleHour[];
  }

  if (schedules.length === 1) {
    const schedule = schedules[0];
    if (schedule?.isValid && !schedule.isValid()) {
      return [] as ScheduleHour[];
    }
    return Array.from(listScheduleHoursForDay(realm, schedule, weekday));
  }

  const scheduleClientIds = new Set<string>();
  const scheduleServerIds = new Set<number>();
  for (const schedule of schedules) {
    if (schedule.isValid && !schedule.isValid()) {
      continue;
    }
    if (schedule.client_id) {
      scheduleClientIds.add(schedule.client_id);
    }
    if (typeof schedule.server_id === "number") {
      scheduleServerIds.add(schedule.server_id);
    }
  }

  const results = realm
    .objects<ScheduleHour>("ScheduleHour")
    .filtered('weekday == $0 && sync_status != "DELETED"', weekday);

  const list: ScheduleHour[] = [];
  for (const item of results) {
    if (item.isValid && !item.isValid()) {
      continue;
    }
    const matchesSchedule =
      (item.schedule_client_id &&
        scheduleClientIds.has(item.schedule_client_id)) ||
      (typeof item.schedule_server_id === "number" &&
        scheduleServerIds.has(item.schedule_server_id));
    if (matchesSchedule) {
      list.push(item);
    }
  }
  return list;
}

export function softDeleteScheduleHours(items: Iterable<ScheduleHour>) {
  const now = new Date();
  items.forEach((item) => {
    if (item.isValid && !item.isValid()) {
      return;
    }
    item.sync_status = "DELETED" as never;
    item.local_updated_at = now;
  });
}

export function softDeleteScheduleHoursForEmployeeDay(
  realm: Realm,
  employee: Employee,
  weekday: Weekday,
) {
  const items = listScheduleHoursForEmployeeDay(realm, employee, weekday);
  if (items.length === 0) {
    return;
  }
  softDeleteScheduleHours(items);
}

export function enqueueDeleteDayForSchedule(
  realm: Realm,
  schedule: Schedule,
  weekday: Weekday,
) {
  enqueue(realm, "SCHEDULE_HOUR_DELETE_DAY", {
    schedule_client_id: schedule.client_id,
    schedule_server_id: schedule.server_id,
    weekday,
  });
}

export function addScheduleHourForSchedule(
  realm: Realm,
  schedule: Schedule,
  weekday: Weekday,
  startMinutes: number,
  endMinutes: number,
) {
  const scheduleHourClientId = uuid();
  realm.create<ScheduleHour>("ScheduleHour", {
    client_id: scheduleHourClientId,
    schedule_client_id: schedule.client_id,
    schedule_server_id: schedule.server_id,
    weekday,
    start_time_minutes: startMinutes,
    end_time_minutes: endMinutes,
    block_type: "WORK",
    local_updated_at: new Date(),
    sync_status: "DIRTY",
  });
  enqueue(realm, "SCHEDULE_HOUR_UPSERT", {
    client_id: scheduleHourClientId,
    schedule_client_id: schedule.client_id,
    schedule_server_id: schedule.server_id,
    weekday,
    start_time_minutes: startMinutes,
    end_time_minutes: endMinutes,
    block_type: "WORK",
  });
}

export function replaceScheduleDayForSchedule(
  realm: Realm,
  schedule: Schedule,
  weekday: Weekday,
  startMinutes: number,
  endMinutes: number,
) {
  const existing = listScheduleHoursForDay(realm, schedule, weekday);
  if (existing.length > 0) {
    softDeleteScheduleHours(existing);
  }

  const scheduleHourClientId = uuid();
  realm.create<ScheduleHour>("ScheduleHour", {
    client_id: scheduleHourClientId,
    schedule_client_id: schedule.client_id,
    schedule_server_id: schedule.server_id,
    weekday,
    start_time_minutes: startMinutes,
    end_time_minutes: endMinutes,
    block_type: "WORK",
    local_updated_at: new Date(),
    sync_status: "DIRTY",
  });
  enqueue(realm, "SCHEDULE_HOUR_REPLACE_DAY", {
    client_id: scheduleHourClientId,
    schedule_client_id: schedule.client_id,
    schedule_server_id: schedule.server_id,
    weekday,
    start_time_minutes: startMinutes,
    end_time_minutes: endMinutes,
    block_type: "WORK",
  });
}

export function resolveScheduleForHour(
  realm: Realm,
  scheduleHour: ScheduleHour,
): Schedule | null {
  if (scheduleHour.schedule_client_id) {
    const schedule = realm.objectForPrimaryKey<Schedule>(
      "Schedule",
      scheduleHour.schedule_client_id,
    );
    if (schedule) {
      return schedule;
    }
  }
  if (scheduleHour.schedule_server_id !== undefined) {
    return (
      realm
        .objects<Schedule>("Schedule")
        .filtered("server_id == $0", scheduleHour.schedule_server_id)[0] ?? null
    );
  }
  return null;
}
