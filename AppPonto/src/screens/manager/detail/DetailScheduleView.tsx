import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import type { ScheduleHour } from "@/src/databases/schemas";
import { WEEKDAYS, type Weekday } from "../utils/constants";
import { formatHours } from "../utils/utils";
import { InlineFeedback } from "./schedule/InlineFeedback";
import { ScheduleDayCard } from "./schedule/ScheduleDayCard";
import { SubmitButton } from "./schedule/SubmitButton";
import { TimeRangeInputs } from "./schedule/TimeRangeInputs";

type WeekStats = {
  dayBuckets: Map<Weekday, ScheduleHour[]>;
  dayTotals: Map<Weekday, number>;
  weekMinutes: number;
};

type DayFormState = {
  weekday: Weekday;
  onWeekdayChange: (value: Weekday) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  onSubmit: () => void;
};

type DefaultFormState = {
  ranges: Array<{ startTime: string; endTime: string }>;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onChangeRangeStart: (index: number, value: string) => void;
  onChangeRangeEnd: (index: number, value: string) => void;
  weekdays: boolean[];
  onToggleWeekday: (index: number) => void;
  onSubmit: () => void;
};

type EditFormState = {
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  onSubmit: () => void;
};

type DetailScheduleViewProps = {
  message?: string | null;
  error?: string | null;
  canEditSchedule: boolean;
  selectedWeekday: Weekday | null;
  weekStats: WeekStats;
  selectedDayDetails: ScheduleHour[];
  selectedDayTotalMinutes: number;
  editingScheduleHourId: string | null;
  showCreateDayForm: boolean;
  showDefaultForm: boolean;
  showEditForm: boolean;
  onToggleCreateDayForm: () => void;
  onToggleDefaultForm: () => void;
  onToggleEditForm: () => void;
  onDeleteDay: () => void;
  onSelectDay: (weekday: number) => void;
  onAddDay: (weekday: Weekday) => void;
  onEditScheduleHour: (hour: ScheduleHour) => void;
  onDeleteScheduleHour: (scheduleHourId: string) => void;
  createDay: DayFormState;
  defaultSchedule: DefaultFormState;
  editDay: EditFormState;
};

export default function DetailScheduleView({
  message,
  error,
  canEditSchedule,
  selectedWeekday,
  weekStats,
  selectedDayDetails,
  selectedDayTotalMinutes,
  editingScheduleHourId,
  showCreateDayForm,
  showDefaultForm,
  showEditForm,
  onToggleCreateDayForm,
  onToggleDefaultForm,
  onToggleEditForm,
  onDeleteDay,
  onSelectDay,
  onAddDay,
  onEditScheduleHour,
  onDeleteScheduleHour,
  createDay,
  defaultSchedule,
  editDay,
}: DetailScheduleViewProps) {
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const safeDayDetails = useMemo(
    () =>
      selectedDayDetails.filter((item) =>
        item?.isValid ? item.isValid() : true,
      ),
    [selectedDayDetails],
  );
  const weekdayOptions = WEEKDAYS.map((day) => ({
    value: day.value,
    label: day.label,
  }));

  useEffect(() => {
    const isScheduleContext = showCreateDayForm || showDefaultForm || showEditForm;
    if (isScheduleContext && message && !error) {
      setScheduleSuccess(true);
      const timer = setTimeout(() => setScheduleSuccess(false), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, error, showCreateDayForm, showDefaultForm, showEditForm]);

  useEffect(() => {
    if (error) {
      setScheduleSuccess(false);
    }
  }, [error]);

  const submitStatus = error ? "error" : scheduleSuccess ? "success" : "idle";

  const selectedDayStatus = useMemo(() => {
    if (!canEditSchedule) {
      return null;
    }
    if (selectedWeekday === null) {
      return null;
    }
    if (safeDayDetails.length === 0) {
      return {
        label: "Sem horário",
        icon: "minus-circle" as const,
        container: "bg-slate-800 border-slate-700",
        text: "text-slate-400",
        iconColor: "#94a3b8",
      };
    }
    return {
      label: "Com horário",
      icon: "check-circle" as const,
      container: "bg-emerald-500/15 border-emerald-500/30",
      text: "text-emerald-200",
      iconColor: "#34d399",
    };
  }, [canEditSchedule, selectedWeekday, safeDayDetails.length]);

  if (!canEditSchedule) {
    return null;
  }

  return (
    <>
      {showCreateDayForm && selectedWeekday === null ? (
        <>
          <Text className="mt-5 text-xs uppercase tracking-widest text-slate-400">
            Adicionar horário
          </Text>
          <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
            <SelectSheet
              label="Dia da semana"
              value={createDay.weekday}
              options={weekdayOptions}
              onChange={createDay.onWeekdayChange}
            />
            <TimeRangeInputs
              startTime={createDay.startTime}
              endTime={createDay.endTime}
              onStartTimeChange={createDay.onStartTimeChange}
              onEndTimeChange={createDay.onEndTimeChange}
            />
            <SubmitButton
              status={submitStatus}
              idleLabel="Salvar"
              successLabel="Enviado"
              errorLabel="Falhou"
              onPress={createDay.onSubmit}
            />
            <InlineFeedback message={message} error={error} />
          </Box>
        </>
      ) : null}

      {showDefaultForm ? (
        <>
          <Text className="mt-5 text-xs uppercase tracking-widest text-slate-400">
            Horário padrão da semana
          </Text>
          <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
            {defaultSchedule.ranges.map((range, index) => (
              <Box key={String(index)} className="mb-2">
                <TimeRangeInputs
                  startTime={range.startTime}
                  endTime={range.endTime}
                  onStartTimeChange={(value) =>
                    defaultSchedule.onChangeRangeStart(index, value)
                  }
                  onEndTimeChange={(value) =>
                    defaultSchedule.onChangeRangeEnd(index, value)
                  }
                />
                {defaultSchedule.ranges.length > 1 ? (
                  <Pressable
                    className="self-end rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1"
                    onPress={() => defaultSchedule.onRemoveRange(index)}
                  >
                    <Box className="flex-row items-center">
                      <Feather name="trash-2" size={12} color="#fca5a5" />
                      <Text className="text-rose-200 text-[10px] font-semibold ml-1">
                        Remover faixa
                      </Text>
                    </Box>
                  </Pressable>
                ) : null}
              </Box>
            ))}
            <Pressable
              className="self-start rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2"
              onPress={defaultSchedule.onAddRange}
            >
              <Box className="flex-row items-center">
                <Feather name="plus" size={14} color="#e2e8f0" />
                <Text className="text-slate-200 text-xs font-semibold ml-2">
                  Adicionar faixa
                </Text>
              </Box>
            </Pressable>
            <Text className="text-slate-400 text-xs mb-2">Dias da semana</Text>
            <Box className="flex-row flex-wrap mb-3">
              {WEEKDAYS.map((day) => (
                <Pressable
                  key={day.value}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                    defaultSchedule.weekdays[day.value]
                      ? "bg-sky-500/20 border-sky-500/30"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                  onPress={() => defaultSchedule.onToggleWeekday(day.value)}
                >
                  <Text className="text-slate-50 text-xs font-semibold">
                    {day.short}
                  </Text>
                </Pressable>
              ))}
            </Box>
            <SubmitButton
              status={submitStatus}
              idleLabel="Aplicar"
              successLabel="Enviado"
              errorLabel="Falhou"
              onPress={defaultSchedule.onSubmit}
            />
            <InlineFeedback message={message} error={error} />
          </Box>
        </>
      ) : null}

      <Text className="mt-6 text-xs uppercase tracking-widest text-slate-400">
        Semana
      </Text>
      <Box className="flex-row items-center mt-2">
        <Feather name="clock" size={12} color="#94a3b8" />
        <Text className="text-slate-400 text-xs ml-2">
          Total da semana: {formatHours(weekStats.weekMinutes)}
        </Text>
      </Box>
      <Box className="mt-3">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedWeekday === day.value;
          const totalMinutes = weekStats.dayTotals.get(day.value) ?? 0;
          const dayDetails =
            weekStats.dayBuckets.get(day.value)?.filter((item) =>
              item?.isValid ? item.isValid() : true,
            ) ?? [];

          return (
            <ScheduleDayCard
              key={day.value}
              day={day}
              isSelected={isSelected}
              totalMinutes={totalMinutes}
              selectedDayTotalMinutes={selectedDayTotalMinutes}
              status={isSelected ? selectedDayStatus : null}
              dayDetails={isSelected ? safeDayDetails : dayDetails}
              editingScheduleHourId={editingScheduleHourId}
              showCreateDayForm={isSelected && showCreateDayForm}
              showEditForm={isSelected && showEditForm}
              onSelectDay={onSelectDay}
              onAddDay={onAddDay}
              onToggleEditForm={onToggleEditForm}
              onDeleteDay={onDeleteDay}
              onEditScheduleHour={onEditScheduleHour}
              onDeleteScheduleHour={onDeleteScheduleHour}
              createDay={createDay}
              editDay={editDay}
              message={message}
              error={error}
              submitStatus={submitStatus}
            />
          );
        })}
      </Box>
    </>
  );
}
