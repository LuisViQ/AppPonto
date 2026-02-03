import React from "react";
import { Alert, Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import type { ScheduleHour } from "@/src/databases/schemas";
import type { Weekday } from "../../utils/constants";
import { formatHours, formatTimeFromMinutes } from "../../utils/utils";
import { InlineFeedback } from "./InlineFeedback";
import { SubmitButton } from "./SubmitButton";
import { TimeRangeInputs } from "./TimeRangeInputs";

type DayItem = {
  value: Weekday;
  label: string;
  short: string;
};

type StatusBadge = {
  label: string;
  icon: "minus-circle" | "check-circle";
  container: string;
  text: string;
  iconColor: string;
};

type DayCardProps = {
  day: DayItem;
  isSelected: boolean;
  totalMinutes: number;
  selectedDayTotalMinutes: number;
  status: StatusBadge | null;
  dayDetails: ScheduleHour[];
  editingScheduleHourId: string | null;
  showCreateDayForm: boolean;
  showEditForm: boolean;
  onSelectDay: (weekday: number) => void;
  onAddDay: (weekday: Weekday) => void;
  onToggleEditForm: () => void;
  onDeleteDay: () => void;
  onEditScheduleHour: (hour: ScheduleHour) => void;
  onDeleteScheduleHour: (scheduleHourId: string) => void;
  createDay: {
    startTime: string;
    endTime: string;
    onStartTimeChange: (value: string) => void;
    onEndTimeChange: (value: string) => void;
    onSubmit: () => void;
  };
  editDay: {
    startTime: string;
    endTime: string;
    onStartTimeChange: (value: string) => void;
    onEndTimeChange: (value: string) => void;
    onSubmit: () => void;
  };
  message?: string | null;
  error?: string | null;
  submitStatus: "idle" | "success" | "error";
};

export function ScheduleDayCard({
  day,
  isSelected,
  totalMinutes,
  selectedDayTotalMinutes,
  status,
  dayDetails,
  editingScheduleHourId,
  showCreateDayForm,
  showEditForm,
  onSelectDay,
  onAddDay,
  onToggleEditForm,
  onDeleteDay,
  onEditScheduleHour,
  onDeleteScheduleHour,
  createDay,
  editDay,
  message,
  error,
  submitStatus,
}: DayCardProps) {
  return (
    <Pressable
      className={`px-4 py-5 rounded-2xl mb-4 border ${
        isSelected ? "bg-slate-800 border-slate-700" : "bg-slate-950 border-slate-900"
      }`}
      onPress={() => onSelectDay(day.value)}
    >
      <Box className="flex-row items-center justify-between">
        <Text className="text-slate-50 text-base font-semibold">{day.label}</Text>
        <Box className="flex-row items-center">
          <Text className="text-slate-400 text-xs">
            {totalMinutes > 0 ? formatHours(totalMinutes) : "Folga"}
          </Text>
          <Pressable
            className="ml-2 rounded-full bg-slate-800 px-2 py-1"
            onPress={() => onAddDay(day.value)}
          >
            <Feather name="plus" size={12} color="#e2e8f0" />
          </Pressable>
        </Box>
      </Box>

      {isSelected ? (
        <Box className="mt-3 border-t border-slate-800 pt-3">
          <Box className="flex-row items-center justify-between">
            <Text className="text-slate-400 text-xs">
              Total: {formatHours(selectedDayTotalMinutes)}
            </Text>
            {status ? (
              <Box className={`flex-row items-center px-2 py-1 rounded-full border ${status.container}`}>
                <Feather name={status.icon} size={12} color={status.iconColor} />
                <Text className={`text-[10px] font-semibold ml-1 ${status.text}`}>
                  {status.label}
                </Text>
              </Box>
            ) : null}
          </Box>

          <Box className="flex-row mt-2">
            {dayDetails.length === 0 ? (
              <Pressable
                className="bg-slate-800 px-2 py-1 rounded-lg mr-2"
                onPress={() => onAddDay(day.value)}
              >
                <Text className="text-slate-200 text-[10px] font-semibold">Criar</Text>
              </Pressable>
            ) : (
              <Pressable
                className="bg-slate-800 px-2 py-1 rounded-lg mr-2"
                onPress={onToggleEditForm}
              >
                <Text className="text-slate-200 text-[10px] font-semibold">
                  {showEditForm ? "Fechar edicao" : "Editar"}
                </Text>
              </Pressable>
            )}
            {dayDetails.length > 0 ? (
              <Pressable
                className="bg-rose-500/20 px-2 py-1 rounded-lg"
                onPress={() =>
                  Alert.alert("Remover dia", "Deseja remover os horarios desse dia?", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Remover", style: "destructive", onPress: onDeleteDay },
                  ])
                }
              >
                <Text className="text-rose-200 text-[10px] font-semibold">Remover</Text>
              </Pressable>
            ) : null}
          </Box>

          {showCreateDayForm ? (
            <Box className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <Text className="text-slate-400 text-xs mb-2">Adicionar horario</Text>
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
          ) : null}

          {showEditForm && dayDetails.length > 0 ? (
            <Box className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <TimeRangeInputs
                startTime={editDay.startTime}
                endTime={editDay.endTime}
                onStartTimeChange={editDay.onStartTimeChange}
                onEndTimeChange={editDay.onEndTimeChange}
              />
              <SubmitButton
                status={submitStatus}
                idleLabel={editingScheduleHourId ? "Salvar horario" : "Salvar dia"}
                successLabel="Enviado"
                errorLabel="Falhou"
                onPress={editDay.onSubmit}
              />
              <InlineFeedback message={message} error={error} />
            </Box>
          ) : null}

          {dayDetails.length === 0 ? (
            <Text className="text-slate-400 mt-3">Folga</Text>
          ) : (
            dayDetails.map((item) => {
              const isEditing = item.client_id === editingScheduleHourId;
              return (
                <Box
                  key={item.client_id}
                  className={`flex-row items-center justify-between border-b border-slate-800 py-2 ${
                    isEditing ? "bg-slate-900/60 rounded-lg px-2" : ""
                  }`}
                >
                  <Text className="text-slate-200 text-xs font-semibold">Horario</Text>
                  <Box className="flex-row items-center">
                    <Text className="text-slate-400 text-xs mr-2">
                      {formatTimeFromMinutes(item.start_time_minutes)} -{" "}
                      {formatTimeFromMinutes(item.end_time_minutes)}
                    </Text>
                    <Pressable
                      className="rounded-full bg-slate-800 px-2 py-1"
                      onPress={() => onEditScheduleHour(item)}
                    >
                      <Box className="flex-row items-center">
                        <Feather name="edit-2" size={12} color="#e2e8f0" />
                        <Text className="text-slate-200 text-[10px] font-semibold ml-1">
                          Editar
                        </Text>
                      </Box>
                    </Pressable>
                    <Pressable
                      className="rounded-full bg-rose-500/20 px-2 py-1 ml-2"
                      onPress={() =>
                        Alert.alert("Excluir horario", "Deseja remover este horario?", [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Excluir",
                            style: "destructive",
                            onPress: () => onDeleteScheduleHour(item.client_id),
                          },
                        ])
                      }
                    >
                      <Box className="flex-row items-center">
                        <Feather name="trash-2" size={12} color="#fca5a5" />
                        <Text className="text-rose-200 text-[10px] font-semibold ml-1">
                          Excluir
                        </Text>
                      </Box>
                    </Pressable>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      ) : null}
    </Pressable>
  );
}
