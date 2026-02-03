import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import { useKeyboardInset } from "@/src/utils/useKeyboardInset";

import {
  ACCOUNT_FILTER_LABELS,
  type AccountTypeFilter,
  type Weekday,
  WEEKDAYS,
} from "../utils/constants";
import { useManagerContext } from "../context/ManagerContext";

type BulkCreateProps = {
  show: boolean;
  onToggle: () => void;
  weekday: Weekday;
  onWeekdayChange: (value: Weekday) => void;
  ranges: Array<{ startTime: string; endTime: string }>;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onChangeRangeStart: (index: number, value: string) => void;
  onChangeRangeEnd: (index: number, value: string) => void;
  onSubmit: () => void;
};

type BulkDefaultProps = {
  show: boolean;
  onToggle: () => void;
  ranges: Array<{ startTime: string; endTime: string }>;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onChangeRangeStart: (index: number, value: string) => void;
  onChangeRangeEnd: (index: number, value: string) => void;
  weekdays: boolean[];
  onToggleWeekday: (index: number) => void;
  onSubmit: () => void;
};

const TYPE_FILTERS: AccountTypeFilter[] = ["ALL", "ADMIN", "EMPLOYEE"];

export default function ManagerUsersBulkView() {
  const { usersBulkProps, layout } = useManagerContext();
  const {
    typeFilter,
    typeCounts,
    onTypeFilterChange,
    jobPositions,
    jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange,
    bulkTargetCount,
    bulkSubmitting = false,
    bulkCreate,
    bulkDefault,
  } = usersBulkProps as {
    typeFilter: AccountTypeFilter;
    typeCounts: Record<AccountTypeFilter, number>;
    onTypeFilterChange: (value: AccountTypeFilter) => void;
    jobPositions: any[];
    jobPositionFilter: string;
    jobPositionCounts: Record<string, number>;
    onJobPositionFilterChange: (value: string) => void;
    bulkTargetCount: number;
    bulkSubmitting?: boolean;
    bulkCreate: BulkCreateProps;
    bulkDefault: BulkDefaultProps;
  };
  const { message, error } = layout;
  const [successPulse, setSuccessPulse] = useState(false);
  const keyboardHeight = useKeyboardInset();
  const typeOptions = TYPE_FILTERS.map((type) => ({
    value: type,
    label: `${ACCOUNT_FILTER_LABELS[type]} (${typeCounts[type]})`,
  }));

  const jobPositionOptions = [
    { value: "ALL", label: `Todos cargos (${jobPositionCounts.ALL ?? 0})` },
    ...jobPositions.map((position) => ({
      value: position.client_id,
      label: `${position.name} (${jobPositionCounts[position.client_id] ?? 0})`,
      description: position.description ?? undefined,
    })),
  ];

  const weekdayOptions = WEEKDAYS.map((day) => ({
    value: day.value,
    label: day.label,
  }));

  useEffect(() => {
    if (message && !error) {
      setSuccessPulse(true);
      const timer = setTimeout(() => setSuccessPulse(false), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, error]);

  useEffect(() => {
    if (error) {
      setSuccessPulse(false);
    }
  }, [error]);

  const confirmAction = (message: string, onConfirm: () => void) => {
    if (bulkSubmitting) {
      return;
    }
    Alert.alert("Tem certeza?", message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: onConfirm },
    ]);
  };

  return (
    <Box style={{ paddingBottom: keyboardHeight }}>
      <Text className="mt-5 text-xs uppercase tracking-widest text-slate-500">
        Ações em lote
      </Text>
      {message ? (
        <Box className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
          <Text className="text-sky-200 text-xs">{message}</Text>
        </Box>
      ) : null}
      {error ? (
        <Box className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
          <Text className="text-rose-200 text-xs">{error}</Text>
        </Box>
      ) : null}
      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
        <Text className="text-slate-400 text-xs">
          Aplica ao filtro atual (conta + cargo).
        </Text>
        <SelectSheet
          label="Filtro por conta"
          value={typeFilter}
          options={typeOptions}
          onChange={onTypeFilterChange}
        />
        <SelectSheet
          label="Filtro por cargo"
          value={jobPositionFilter}
          options={jobPositionOptions}
          onChange={onJobPositionFilterChange}
        />
        <Text className="text-slate-500 text-xs mt-2">
          Alvo: {bulkTargetCount} funcionário(s)
        </Text>
      </Box>

      <Box className="flex-row flex-wrap mt-3">
        <Pressable
          className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
            bulkCreate.show
              ? "bg-sky-500/20 border-sky-500/30"
              : "bg-slate-900/60 border-slate-800"
          }`}
          onPress={bulkCreate.onToggle}
        >
          <Box className="flex-row items-center">
            <Feather name="plus-circle" size={14} color="#e2e8f0" />
            <Text className="text-slate-50 text-xs font-semibold ml-2">
              {bulkCreate.show ? "Fechar horário" : "Adicionar horário"}
            </Text>
          </Box>
        </Pressable>
        <Pressable
          className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
            bulkDefault.show
              ? "bg-sky-500/20 border-sky-500/30"
              : "bg-slate-900/60 border-slate-800"
          }`}
          onPress={bulkDefault.onToggle}
        >
          <Box className="flex-row items-center">
            <Feather name="repeat" size={14} color="#e2e8f0" />
            <Text className="text-slate-50 text-xs font-semibold ml-2">
              {bulkDefault.show ? "Fechar padrão" : "Horário padrão"}
            </Text>
          </Box>
        </Pressable>
      </Box>

      {bulkCreate.show ? (
        <>
          <Text className="mt-4 text-xs uppercase tracking-widest text-slate-500">
            Adicionar horário em lote
          </Text>
          <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
            <SelectSheet
              label="Dia da semana"
              value={bulkCreate.weekday}
              options={weekdayOptions}
              onChange={bulkCreate.onWeekdayChange}
            />
            {bulkCreate.ranges.map((range, index) => (
              <Box key={String(index)} className="mb-2">
                <Box className="flex-row justify-between">
                  <TextInput
                    className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-2 placeholder:text-slate-500 w-[48%] border border-slate-800"
                    placeholder="Inicio (HH:MM)"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={range.startTime}
                    onChangeText={(value) =>
                      bulkCreate.onChangeRangeStart(index, value)
                    }
                  />
                  <TextInput
                    className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-2 placeholder:text-slate-500 w-[48%] border border-slate-800"
                    placeholder="Fim (HH:MM)"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={range.endTime}
                    onChangeText={(value) =>
                      bulkCreate.onChangeRangeEnd(index, value)
                    }
                  />
                </Box>
                {bulkCreate.ranges.length > 1 ? (
                  <Pressable
                    className="self-end rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1"
                    onPress={() => bulkCreate.onRemoveRange(index)}
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
              onPress={bulkCreate.onAddRange}
            >
              <Box className="flex-row items-center">
                <Feather name="plus" size={14} color="#e2e8f0" />
                <Text className="text-slate-200 text-xs font-semibold ml-2">
                  Adicionar faixa
                </Text>
              </Box>
            </Pressable>
            <Pressable
              className={`py-3 rounded-xl items-center ${
                error
                  ? "bg-rose-500/80"
                  : successPulse
                    ? "bg-emerald-500/80"
                    : "bg-sky-500/80"
              } ${bulkSubmitting ? "opacity-70" : ""}`}
              onPress={() =>
                confirmAction(
                  "Adicionar estes horários para todos do filtro?",
                  bulkCreate.onSubmit,
                )
              }
              disabled={bulkSubmitting}
            >
              {bulkSubmitting ? (
                <ActivityIndicator color="#f8fafc" />
              ) : error ? (
                <Box className="flex-row items-center">
                  <Feather name="alert-circle" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Falhou
                  </Text>
                </Box>
              ) : successPulse ? (
                <Box className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Enviado
                  </Text>
                </Box>
              ) : (
                <Box className="flex-row items-center">
                  <Feather name="plus-circle" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Aplicar para todos
                  </Text>
                </Box>
              )}
            </Pressable>
          </Box>
        </>
      ) : null}

      {bulkDefault.show ? (
        <>
          <Text className="mt-4 text-xs uppercase tracking-widest text-slate-500">
            Horário padrão em lote
          </Text>
          <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
            {bulkDefault.ranges.map((range, index) => (
              <Box key={String(index)} className="mb-2">
                <Box className="flex-row justify-between">
                  <TextInput
                    className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-2 placeholder:text-slate-500 w-[48%] border border-slate-800"
                    placeholder="Inicio (HH:MM)"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={range.startTime}
                    onChangeText={(value) =>
                      bulkDefault.onChangeRangeStart(index, value)
                    }
                  />
                  <TextInput
                    className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-2 placeholder:text-slate-500 w-[48%] border border-slate-800"
                    placeholder="Fim (HH:MM)"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={range.endTime}
                    onChangeText={(value) =>
                      bulkDefault.onChangeRangeEnd(index, value)
                    }
                  />
                </Box>
                {bulkDefault.ranges.length > 1 ? (
                  <Pressable
                    className="self-end rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1"
                    onPress={() => bulkDefault.onRemoveRange(index)}
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
              onPress={bulkDefault.onAddRange}
            >
              <Box className="flex-row items-center">
                <Feather name="plus" size={14} color="#e2e8f0" />
                <Text className="text-slate-200 text-xs font-semibold ml-2">
                  Adicionar faixa
                </Text>
              </Box>
            </Pressable>
            <Box className="flex-row flex-wrap mb-3">
              {WEEKDAYS.map((day) => (
                <Pressable
                  key={day.value}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                    bulkDefault.weekdays[day.value]
                      ? "bg-sky-500/20 border-sky-500/30"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                  onPress={() => bulkDefault.onToggleWeekday(day.value)}
                >
                  <Text className="text-slate-50 text-xs font-semibold">
                    {day.short}
                  </Text>
                </Pressable>
              ))}
            </Box>
            <Pressable
              className={`py-3 rounded-xl items-center ${
                error
                  ? "bg-rose-500/80"
                  : successPulse
                    ? "bg-emerald-500/80"
                    : "bg-sky-500/80"
              } ${bulkSubmitting ? "opacity-70" : ""}`}
              onPress={() =>
                confirmAction(
                  "Aplicar horário padrão para todos do filtro?",
                  bulkDefault.onSubmit,
                )
              }
              disabled={bulkSubmitting}
            >
              {bulkSubmitting ? (
                <ActivityIndicator color="#f8fafc" />
              ) : error ? (
                <Box className="flex-row items-center">
                  <Feather name="alert-circle" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Falhou
                  </Text>
                </Box>
              ) : successPulse ? (
                <Box className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Enviado
                  </Text>
                </Box>
              ) : (
                <Box className="flex-row items-center">
                  <Feather name="repeat" size={16} color="#f8fafc" />
                  <Text className="text-slate-50 font-semibold ml-2">
                    Aplicar para todos
                  </Text>
                </Box>
              )}
            </Pressable>
          </Box>
        </>
      ) : null}

    </Box>
  );
}

