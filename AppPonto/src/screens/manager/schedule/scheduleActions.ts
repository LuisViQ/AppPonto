import type Realm from "realm";

import type { Employee, ScheduleHour } from "@/src/databases/schemas";
import { enqueue } from "@/src/services/outboxService";
import type { Weekday } from "../utils/constants";
import {
  normalizeWeekday,
  parseDayRangeInput,
  parseRangesInput,
} from "./scheduleHelpers";
import {
  addScheduleHourForSchedule,
  enqueueDeleteDayForSchedule,
  getOrCreateScheduleForEmployee,
  listScheduleHoursForDay,
  listScheduleHoursForEmployeeDay,
  listSchedulesForEmployee,
  replaceScheduleDayForSchedule,
  resolveScheduleForHour,
  softDeleteScheduleHours,
  softDeleteScheduleHoursForEmployeeDay,
} from "./scheduleStore";

export type ScheduleActionResult = {
  error?: string;
  message?: string;
};

const BULK_CHUNK_SIZE = 50;
const BULK_YIELD_MS = 0;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hasTimeConflict(
  existing: Iterable<ScheduleHour>,
  startMinutes: number,
  endMinutes: number,
) {
  for (const item of existing) {
    if (item.isValid && !item.isValid()) {
      continue;
    }
    const start = item.start_time_minutes;
    const end = item.end_time_minutes;
    if (startMinutes < end && endMinutes > start) {
      return true;
    }
  }
  return false;
}

export function createScheduleHourForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: {
    weekday: number | null;
    startTime: string;
    endTime: string;
  },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }

  const parsed = parseDayRangeInput(params);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const { weekday, startMinutes, endMinutes } = parsed;

  const schedule = getOrCreateScheduleForEmployee(realm, employee);
  const existing = listScheduleHoursForEmployeeDay(realm, employee, weekday);
  if (hasTimeConflict(existing, startMinutes, endMinutes)) {
    return { error: "Horário conflitante" };
  }
  realm.write(() => {
    addScheduleHourForSchedule(
      realm,
      schedule,
      weekday,
      startMinutes,
      endMinutes,
    );
  });

  return { message: "Horário adicionado" };
}

export function applyDefaultScheduleForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: {
    weekdays: boolean[];
    ranges: Array<{ startTime: string; endTime: string }>;
  },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }

  if (!params.ranges || params.ranges.length === 0) {
    return { error: "Informe ao menos um horário" };
  }

  const parsed = parseRangesInput(params.ranges);
  if (parsed.error) {
    return {
      error:
        parsed.error === "Horário inválido"
          ? "Horário padrão inválido"
          : parsed.error,
    };
  }
  const ranges = parsed.ranges ?? [];
  if (!params.weekdays.some(Boolean)) {
    return { error: "Selecione pelo menos um dia" };
  }

  const schedule = getOrCreateScheduleForEmployee(realm, employee);
  const schedulesForEmployee = listSchedulesForEmployee(realm, employee);
  const schedulesToClear =
    schedulesForEmployee.length > 0 ? schedulesForEmployee : [schedule];
  realm.write(() => {
    params.weekdays.forEach((enabled, index) => {
      if (!enabled) {
        return;
      }
      const weekday = normalizeWeekday(index);
      if (weekday === null) {
        return;
      }
      softDeleteScheduleHoursForEmployeeDay(realm, employee, weekday);
      schedulesToClear.forEach((item) =>
        enqueueDeleteDayForSchedule(realm, item, weekday),
      );
      ranges.forEach((range) => {
        addScheduleHourForSchedule(
          realm,
          schedule,
          weekday,
          range.startMinutes,
          range.endMinutes,
        );
      });
    });
  });

  return { message: "Horário padrão aplicado" };
}

export function updateScheduleDayForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: {
    weekday: number | null;
    startTime: string;
    endTime: string;
  },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }

  const parsed = parseDayRangeInput(params);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const { weekday, startMinutes, endMinutes } = parsed;

  const schedule = getOrCreateScheduleForEmployee(realm, employee);
  realm.write(() => {
    replaceScheduleDayForSchedule(
      realm,
      schedule,
      weekday,
      startMinutes,
      endMinutes,
    );
  });

  return { message: "Horário atualizado" };
}

export function updateScheduleHourForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: {
    scheduleHourId: string | null;
    startTime: string;
    endTime: string;
  },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }
  if (!params.scheduleHourId) {
    return { error: "Selecione um Horário" };
  }

  const scheduleHour = realm.objectForPrimaryKey<ScheduleHour>(
    "ScheduleHour",
    params.scheduleHourId,
  );
  if (!scheduleHour || (scheduleHour.isValid && !scheduleHour.isValid())) {
    return { error: "Horário não encontrado" };
  }

  const parsed = parseDayRangeInput({
    weekday: scheduleHour.weekday,
    startTime: params.startTime,
    endTime: params.endTime,
  });
  if (parsed.error) {
    return { error: parsed.error };
  }
  const { startMinutes, endMinutes } = parsed;

  const schedule = resolveScheduleForHour(realm, scheduleHour);
  if (!schedule) {
    return { error: "Escala não encontrada" };
  }

  const existing = listScheduleHoursForEmployeeDay(
    realm,
    employee,
    scheduleHour.weekday as Weekday,
  );
  const schedulesForEmployee = listSchedulesForEmployee(realm, employee);
  const schedulesToClear =
    schedulesForEmployee.length > 0 ? schedulesForEmployee : [schedule];
  for (const item of existing) {
    if (item.isValid && !item.isValid()) {
      continue;
    }
    if (item.client_id === scheduleHour.client_id) {
      continue;
    }
    const start = item.start_time_minutes;
    const end = item.end_time_minutes;
    if (startMinutes < end && endMinutes > start) {
      realm.write(() => {
        softDeleteScheduleHoursForEmployeeDay(
          realm,
          employee,
          scheduleHour.weekday as Weekday,
        );
        schedulesToClear.forEach((item) =>
          enqueueDeleteDayForSchedule(
            realm,
            item,
            scheduleHour.weekday as Weekday,
          ),
        );
        addScheduleHourForSchedule(
          realm,
          schedule,
          scheduleHour.weekday as Weekday,
          startMinutes,
          endMinutes,
        );
      });
      return { message: "Horário substituído" };
    }
  }

  const now = new Date();
  realm.write(() => {
    scheduleHour.start_time_minutes = startMinutes;
    scheduleHour.end_time_minutes = endMinutes;
    scheduleHour.local_updated_at = now;
    scheduleHour.sync_status = "DIRTY" as never;
  });

  enqueue(realm, "SCHEDULE_HOUR_UPSERT", {
    client_id: scheduleHour.client_id,
    server_id: scheduleHour.server_id,
    schedule_client_id: scheduleHour.schedule_client_id ?? schedule.client_id,
    schedule_server_id: scheduleHour.schedule_server_id ?? schedule.server_id,
    weekday: scheduleHour.weekday,
    start_time_minutes: startMinutes,
    end_time_minutes: endMinutes,
    block_type: scheduleHour.block_type ?? "WORK",
    notes: scheduleHour.notes ?? undefined,
  });

  return { message: "Horário atualizado" };
}

export function deleteScheduleHourForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: { scheduleHourId: string | null },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }
  if (!params.scheduleHourId) {
    return { error: "Selecione um horário" };
  }

  const scheduleHour = realm.objectForPrimaryKey<ScheduleHour>(
    "ScheduleHour",
    params.scheduleHourId,
  );
  if (!scheduleHour || (scheduleHour.isValid && !scheduleHour.isValid())) {
    return { error: "Horário não encontrado" };
  }

  const now = new Date();
  realm.write(() => {
    scheduleHour.sync_status = "DELETED" as never;
    scheduleHour.local_updated_at = now;
  });

  enqueue(realm, "SCHEDULE_HOUR_DELETE", {
    client_id: scheduleHour.client_id,
    server_id: scheduleHour.server_id,
    schedule_client_id: scheduleHour.schedule_client_id,
    schedule_server_id: scheduleHour.schedule_server_id,
    weekday: scheduleHour.weekday,
  });

  return { message: "Horário removido" };
}

export function deleteScheduleDayForEmployee(
  realm: Realm,
  employee: Employee | null,
  params: { weekday: number | null },
): ScheduleActionResult {
  if (!employee) {
    return { error: "Selecione um funcionário" };
  }
  const weekday = normalizeWeekday(params.weekday);
  if (weekday === null) {
    return { error: "Dia da semana inválido" };
  }

  const schedule = getOrCreateScheduleForEmployee(realm, employee);
  realm.write(() => {
    const toDelete = listScheduleHoursForDay(realm, schedule, weekday);
    softDeleteScheduleHours(toDelete);
    enqueueDeleteDayForSchedule(realm, schedule, weekday);
  });

  return { message: "Dia removido" };
}

export async function bulkCreateScheduleHour(
  realm: Realm,
  employees: Employee[],
  params: {
    weekday: number | null;
    startTime: string;
    endTime: string;
  },
): ScheduleActionResult {
  if (employees.length === 0) {
    return { error: "Nenhum funcionário no filtro" };
  }

  const parsed = parseDayRangeInput(params);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const { weekday, startMinutes, endMinutes } = parsed;

  let applied = 0;
  let skipped = 0;
  const chunkSize = Math.max(1, Math.min(BULK_CHUNK_SIZE, employees.length));
  for (let index = 0; index < employees.length; index += chunkSize) {
    const chunk = employees.slice(index, index + chunkSize);
    realm.write(() => {
      chunk.forEach((employee) => {
        const schedule = getOrCreateScheduleForEmployee(realm, employee);
        const existing = listScheduleHoursForEmployeeDay(
          realm,
          employee,
          weekday,
        );
        if (hasTimeConflict(existing, startMinutes, endMinutes)) {
          skipped += 1;
          return;
        }
        addScheduleHourForSchedule(
          realm,
          schedule,
          weekday,
          startMinutes,
          endMinutes,
        );
        applied += 1;
      });
    });
    if (index + chunkSize < employees.length) {
      await delay(BULK_YIELD_MS);
    }
  }

  return {
    message:
      skipped > 0
        ? `Horário aplicado para ${applied} funcionário(s). ${skipped} conflito(s).`
        : `Horário aplicado para ${applied} funcionário(s)`,
  };
}

export async function bulkCreateScheduleHoursForDay(
  realm: Realm,
  employees: Employee[],
  params: {
    weekday: number | null;
    ranges: Array<{ startTime: string; endTime: string }>;
  },
): ScheduleActionResult {
  if (employees.length === 0) {
    return { error: "Nenhum funcionário no filtro" };
  }

  const weekday = normalizeWeekday(params.weekday);
  if (weekday === null) {
    return { error: "Dia da semana inválido" };
  }

  if (!params.ranges || params.ranges.length === 0) {
    return { error: "Informe ao menos um horário" };
  }

  const parsed = parseRangesInput(params.ranges);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const ranges = parsed.ranges ?? [];

  let applied = 0;
  const chunkSize = Math.max(1, Math.min(BULK_CHUNK_SIZE, employees.length));
  for (let index = 0; index < employees.length; index += chunkSize) {
    const chunk = employees.slice(index, index + chunkSize);
    realm.write(() => {
      chunk.forEach((employee) => {
        const schedule = getOrCreateScheduleForEmployee(realm, employee);
        const schedulesForEmployee = listSchedulesForEmployee(realm, employee);
        const schedulesToClear =
          schedulesForEmployee.length > 0 ? schedulesForEmployee : [schedule];
        softDeleteScheduleHoursForEmployeeDay(realm, employee, weekday);
        schedulesToClear.forEach((item) =>
          enqueueDeleteDayForSchedule(realm, item, weekday),
        );
        ranges.forEach((range) => {
          addScheduleHourForSchedule(
            realm,
            schedule,
            weekday,
            range.startMinutes,
            range.endMinutes,
          );
          applied += 1;
        });
      });
    });
    if (index + chunkSize < employees.length) {
      await delay(BULK_YIELD_MS);
    }
  }

  return {
    message: `Horários aplicados: ${applied}.`,
  };
}

export async function bulkApplyDefaultSchedule(
  realm: Realm,
  employees: Employee[],
  params: {
    weekdays: boolean[];
    ranges: Array<{ startTime: string; endTime: string }>;
  },
): ScheduleActionResult {
  if (employees.length === 0) {
    return { error: "Nenhum funcionário no filtro" };
  }

  if (!params.ranges || params.ranges.length === 0) {
    return { error: "Informe ao menos um horário" };
  }

  const parsed = parseRangesInput(params.ranges);
  if (parsed.error) {
    return {
      error:
        parsed.error === "Horário inválido"
          ? "Horário padrão inválido"
          : parsed.error,
    };
  }
  const ranges = parsed.ranges ?? [];
  if (!params.weekdays.some(Boolean)) {
    return { error: "Selecione pelo menos um dia" };
  }

  const chunkSize = Math.max(1, Math.min(BULK_CHUNK_SIZE, employees.length));
  for (let index = 0; index < employees.length; index += chunkSize) {
    const chunk = employees.slice(index, index + chunkSize);
    realm.write(() => {
      chunk.forEach((employee) => {
        const schedule = getOrCreateScheduleForEmployee(realm, employee);
        const schedulesForEmployee = listSchedulesForEmployee(realm, employee);
        const schedulesToClear =
          schedulesForEmployee.length > 0 ? schedulesForEmployee : [schedule];
        params.weekdays.forEach((enabled, weekdayIndex) => {
          if (!enabled) {
            return;
          }
          const weekday = normalizeWeekday(weekdayIndex);
          if (weekday === null) {
            return;
          }
          softDeleteScheduleHoursForEmployeeDay(realm, employee, weekday);
          schedulesToClear.forEach((item) =>
            enqueueDeleteDayForSchedule(realm, item, weekday),
          );
          ranges.forEach((range) => {
            addScheduleHourForSchedule(
              realm,
              schedule,
              weekday,
              range.startMinutes,
              range.endMinutes,
            );
          });
        });
      });
    });
    if (index + chunkSize < employees.length) {
      await delay(BULK_YIELD_MS);
    }
  }

  return {
    message: `Horário padrão aplicado para ${employees.length} funcionários`,
  };
}

export async function bulkEditScheduleDay(
  realm: Realm,
  employees: Employee[],
  params: {
    weekday: number | null;
    startTime: string;
    endTime: string;
  },
): Promise<ScheduleActionResult> {
  if (employees.length === 0) {
    return { error: "Nenhum funcionário no filtro" };
  }

  const parsed = parseDayRangeInput(params);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const { weekday, startMinutes, endMinutes } = parsed;

  const chunkSize = Math.max(1, Math.min(BULK_CHUNK_SIZE, employees.length));
  for (let index = 0; index < employees.length; index += chunkSize) {
    const chunk = employees.slice(index, index + chunkSize);
    realm.write(() => {
      chunk.forEach((employee) => {
        const schedule = getOrCreateScheduleForEmployee(realm, employee);
        const schedulesForEmployee = listSchedulesForEmployee(realm, employee);
        const schedulesToClear =
          schedulesForEmployee.length > 0 ? schedulesForEmployee : [schedule];
        softDeleteScheduleHoursForEmployeeDay(realm, employee, weekday);
        schedulesToClear.forEach((item) =>
          enqueueDeleteDayForSchedule(realm, item, weekday),
        );
        addScheduleHourForSchedule(
          realm,
          schedule,
          weekday,
          startMinutes,
          endMinutes,
        );
      });
    });
    if (index + chunkSize < employees.length) {
      await delay(BULK_YIELD_MS);
    }
  }

  return {
    message: `Horário atualizado para ${employees.length} funcionário(s)`,
  };
}
