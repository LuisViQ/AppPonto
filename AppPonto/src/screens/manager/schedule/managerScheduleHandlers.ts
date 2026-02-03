import type Realm from "realm";

import type { Employee } from "@/src/databases/schemas";
import {
  applyDefaultScheduleForEmployee,
  bulkApplyDefaultSchedule,
  bulkCreateScheduleHoursForDay,
  bulkEditScheduleDay,
  createScheduleHourForEmployee,
  deleteScheduleDayForEmployee,
  deleteScheduleHourForEmployee,
  updateScheduleDayForEmployee,
  updateScheduleHourForEmployee,
} from "./scheduleActions";
import type { EmployeeRow } from "../utils/constants";
import type { ManagerState } from "../hooks/useManagerState";

export function createScheduleHandlers({
  realm,
  schedule,
  feedback,
  selectedEmployee,
}: {
  realm: Realm;
  schedule: ManagerState["schedule"];
  feedback: ManagerState["feedback"];
  selectedEmployee: Employee | null;
}) {
  const handleCreateScheduleHour = () => {
    feedback.setMessage(null);
    feedback.setError(null);
    const targetWeekday =
      schedule.selectedWeekday !== null
        ? schedule.selectedWeekday
        : schedule.createWeekday;
    const result = createScheduleHourForEmployee(realm, selectedEmployee, {
      weekday: targetWeekday,
      startTime: schedule.newStartTime,
      endTime: schedule.newEndTime,
    });

    if (result.error) {
      feedback.setError(result.error);
      return;
    }

    if (result.message) {
      feedback.setMessage(result.message);
    }
    schedule.setShowCreateDayForm(false);
  };

  const handleApplyDefaultSchedule = () => {
    feedback.setMessage(null);
    feedback.setError(null);
    const result = applyDefaultScheduleForEmployee(realm, selectedEmployee, {
      weekdays: schedule.defaultWeekdays,
      ranges: schedule.defaultRanges,
    });

    if (result.error) {
      feedback.setError(result.error);
      return;
    }

    if (result.message) {
      feedback.setMessage(result.message);
    }
    schedule.setShowDefaultForm(false);
  };

  const handleUpdateSelectedDay = () => {
    feedback.setMessage(null);
    feedback.setError(null);
    const result = schedule.editingScheduleHourId
      ? updateScheduleHourForEmployee(realm, selectedEmployee, {
          scheduleHourId: schedule.editingScheduleHourId,
          startTime: schedule.editStartTime,
          endTime: schedule.editEndTime,
        })
      : updateScheduleDayForEmployee(realm, selectedEmployee, {
          weekday: schedule.selectedWeekday,
          startTime: schedule.editStartTime,
          endTime: schedule.editEndTime,
        });

    if (result.error) {
      feedback.setError(result.error);
      return;
    }

    if (result.message) {
      feedback.setMessage(result.message);
    }
    schedule.setShowEditForm(false);
    schedule.setEditingScheduleHourId(null);
  };

  const handleDeleteSelectedDay = () => {
    feedback.setMessage(null);
    feedback.setError(null);
    const result = deleteScheduleDayForEmployee(realm, selectedEmployee, {
      weekday: schedule.selectedWeekday,
    });

    if (result.error) {
      feedback.setError(result.error);
      return;
    }

    if (result.message) {
      feedback.setMessage(result.message);
    }
  };

  const handleDeleteScheduleHour = (scheduleHourId: string) => {
    feedback.setMessage(null);
    feedback.setError(null);
    const result = deleteScheduleHourForEmployee(realm, selectedEmployee, {
      scheduleHourId,
    });

    if (result.error) {
      feedback.setError(result.error);
      return;
    }

    if (result.message) {
      feedback.setMessage(result.message);
    }

    if (schedule.editingScheduleHourId === scheduleHourId) {
      schedule.setEditingScheduleHourId(null);
      schedule.setShowEditForm(false);
    }
  };

  const handleSelectToday = () => {
    const weekday = new Date().getDay();
    schedule.setSelectedWeekday(weekday);
    schedule.setCreateWeekday(weekday);
  };

  return {
    handleCreateScheduleHour,
    handleApplyDefaultSchedule,
    handleUpdateSelectedDay,
    handleDeleteSelectedDay,
    handleDeleteScheduleHour,
    handleSelectToday,
  };
}

export function createBulkScheduleHandlers({
  realm,
  bulk,
  feedback,
  bulkTargetRows,
}: {
  realm: Realm;
  bulk: ManagerState["bulk"];
  feedback: ManagerState["feedback"];
  bulkTargetRows: EmployeeRow[];
}) {
  const handleBulkCreateScheduleHour = async () => {
    if (bulk.bulkSubmitting) {
      return;
    }
    feedback.setMessage(null);
    feedback.setError(null);
    bulk.setBulkSubmitting(true);
    feedback.setMessage("Processando horários...");
    try {
      const result = await bulkCreateScheduleHoursForDay(
        realm,
        bulkTargetRows.map((row) => row.employee),
        {
          weekday: bulk.bulkWeekday,
          ranges: bulk.bulkCreateRanges,
        },
      );

      if (result.error) {
        feedback.setError(result.error);
        feedback.setMessage(null);
        return;
      }

      if (result.message) {
        feedback.setMessage(result.message);
      }
    } finally {
      bulk.setBulkSubmitting(false);
    }
  };

  const handleBulkApplyDefaultSchedule = async () => {
    if (bulk.bulkSubmitting) {
      return;
    }
    feedback.setMessage(null);
    feedback.setError(null);
    bulk.setBulkSubmitting(true);
    feedback.setMessage("Aplicando horário padrão...");
    try {
      const result = await bulkApplyDefaultSchedule(
        realm,
        bulkTargetRows.map((row) => row.employee),
        {
          ranges: bulk.bulkDefaultRanges,
          weekdays: bulk.bulkDefaultWeekdays,
        },
      );

      if (result.error) {
        feedback.setError(result.error);
        feedback.setMessage(null);
        return;
      }

      if (result.message) {
        feedback.setMessage(result.message);
      }
    } finally {
      bulk.setBulkSubmitting(false);
    }
  };

  const handleBulkEditDay = async () => {
    if (bulk.bulkSubmitting) {
      return;
    }
    feedback.setMessage(null);
    feedback.setError(null);
    bulk.setBulkSubmitting(true);
    feedback.setMessage("Atualizando horários...");
    try {
      const result = await bulkEditScheduleDay(
        realm,
        bulkTargetRows.map((row) => row.employee),
        {
          weekday: bulk.bulkEditWeekday,
          startTime: bulk.bulkEditStartTime,
          endTime: bulk.bulkEditEndTime,
        },
      );

      if (result.error) {
        feedback.setError(result.error);
        feedback.setMessage(null);
        return;
      }

      if (result.message) {
        feedback.setMessage(result.message);
      }
    } finally {
      bulk.setBulkSubmitting(false);
    }
  };

  return {
    handleBulkCreateScheduleHour,
    handleBulkApplyDefaultSchedule,
    handleBulkEditDay,
  };
}
