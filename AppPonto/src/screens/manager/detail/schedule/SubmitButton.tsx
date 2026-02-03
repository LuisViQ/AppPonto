import React from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";

type SubmitButtonProps = {
  status: "idle" | "success" | "error";
  idleLabel: string;
  successLabel: string;
  errorLabel: string;
  onPress: () => void;
};

export function SubmitButton({
  status,
  idleLabel,
  successLabel,
  errorLabel,
  onPress,
}: SubmitButtonProps) {
  const label =
    status === "error" ? errorLabel : status === "success" ? successLabel : idleLabel;
  const bgClass =
    status === "error"
      ? "bg-rose-500/80"
      : status === "success"
        ? "bg-emerald-500/80"
        : "bg-sky-500/80";
  return (
    <Pressable className={`py-3 rounded-xl items-center ${bgClass}`} onPress={onPress}>
      <Box className="flex-row items-center">
        {status === "error" ? (
          <Feather name="alert-circle" size={16} color="#f8fafc" />
        ) : status === "success" ? (
          <Feather name="check-circle" size={16} color="#f8fafc" />
        ) : null}
        <Text className="text-slate-50 font-semibold ml-2">{label}</Text>
      </Box>
    </Pressable>
  );
}
