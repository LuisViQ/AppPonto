import React from "react";
import { TextInput } from "react-native";

import { Box } from "@/components/ui/box";

type TimeRangeInputsProps = {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
};

export function TimeRangeInputs({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangeInputsProps) {
  return (
    <Box className="flex-row justify-between">
      <TextInput
        className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 w-[48%] border border-slate-800"
        placeholder="Inicio (HH:MM)"
        keyboardType="number-pad"
        maxLength={5}
        value={startTime}
        onChangeText={onStartTimeChange}
      />
      <TextInput
        className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 w-[48%] border border-slate-800"
        placeholder="Fim (HH:MM)"
        keyboardType="number-pad"
        maxLength={5}
        value={endTime}
        onChangeText={onEndTimeChange}
      />
    </Box>
  );
}
