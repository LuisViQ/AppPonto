import { useMemo } from 'react';

import type { Employee, Schedule, ScheduleHour } from '@/src/databases/schemas';
import type { Weekday } from '../utils/constants';

export function useScheduleData({
  schedules,
  scheduleHours,
  selectedEmployee,
  selectedWeekday,
}: {
  schedules: Schedule[];
  scheduleHours: ScheduleHour[];
  selectedEmployee: Employee | null;
  selectedWeekday: Weekday | null;
}) {
  const isValidObject = (item: { isValid?: () => boolean }) =>
    typeof item.isValid === 'function' ? item.isValid() : true;

  const scheduleContext = useMemo(() => {
    if (!selectedEmployee) {
      return {
        list: [] as Schedule[],
        clientIds: new Set<string>(),
        serverIds: new Set<number>(),
      };
    }

    const list = schedules.filter((schedule) => {
      if (!isValidObject(schedule)) {
        return false;
      }
      const matchClient =
        schedule.employee_client_id &&
        schedule.employee_client_id === selectedEmployee.client_id;
      const matchServer =
        typeof schedule.employee_server_id === 'number' &&
        typeof selectedEmployee.server_id === 'number' &&
        schedule.employee_server_id === selectedEmployee.server_id;
      return matchClient || matchServer;
    });

    const clientIds = new Set<string>();
    const serverIds = new Set<number>();
    list.forEach((schedule) => {
      clientIds.add(schedule.client_id);
      if (typeof schedule.server_id === 'number') {
        serverIds.add(schedule.server_id);
      }
    });

    return { list, clientIds, serverIds };
  }, [selectedEmployee, schedules]);

  const scheduleWeekHours = useMemo(() => {
    if (!selectedEmployee) {
      return [] as ScheduleHour[];
    }
    const { clientIds, serverIds } = scheduleContext;
    return scheduleHours.filter((item) => {
      if (!isValidObject(item)) {
        return false;
      }
      if (item.sync_status === "DELETED") {
        return false;
      }
      const matchesSchedule =
        (item.schedule_client_id && clientIds.has(item.schedule_client_id)) ||
        (item.schedule_server_id && serverIds.has(item.schedule_server_id));
      if (!matchesSchedule) {
        return false;
      }
      return true;
    });
  }, [selectedEmployee, scheduleContext, scheduleHours]);

  const weekStats = useMemo(() => {
    const dayBuckets = new Map<Weekday, ScheduleHour[]>();
    const dayTotals = new Map<Weekday, number>();
    let weekMinutes = 0;

    scheduleWeekHours.forEach((item) => {
      if (item.weekday === undefined || item.weekday === null) {
        return;
      }
      const key = item.weekday as Weekday;
      const bucket = dayBuckets.get(key) ?? [];
      bucket.push(item);
      dayBuckets.set(key, bucket);

      const minutes = Math.max(0, item.end_time_minutes - item.start_time_minutes);
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + minutes);
      weekMinutes += minutes;
    });

    return { dayBuckets, dayTotals, weekMinutes };
  }, [scheduleWeekHours]);

  const selectedDayDetails = useMemo(() => {
    if (selectedWeekday === null) {
      return [] as ScheduleHour[];
    }
    const bucket = weekStats.dayBuckets.get(selectedWeekday) ?? [];
    return [...bucket].sort(
      (a, b) => a.start_time_minutes - b.start_time_minutes,
    );
  }, [selectedWeekday, weekStats]);

  const selectedDayTotalMinutes =
    selectedWeekday !== null ? weekStats.dayTotals.get(selectedWeekday) ?? 0 : 0;

  return {
    scheduleContext,
    scheduleWeekHours,
    weekStats,
    selectedDayDetails,
    selectedDayTotalMinutes,
  };
}
