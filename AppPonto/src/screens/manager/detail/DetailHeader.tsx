import React from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import type { Person } from "@/src/databases/schemas";

type DetailHeaderProps = {
  selectedPerson: Person | null;
  onBack: () => void;
};

export default function DetailHeader({ selectedPerson, onBack }: DetailHeaderProps) {
  return (
    <>
      <Pressable
        className="bg-slate-800 px-3 py-2 rounded-lg mt-4 self-start"
        onPress={onBack}
      >
        <Box className="flex-row items-center">
          <Feather name="chevron-left" size={14} color="#e2e8f0" />
          <Text className="text-slate-200 text-xs font-semibold ml-2">
            Trocar usuário
          </Text>
        </Box>
      </Pressable>

      <Box className="mt-4">
        <Text
          className="text-xl font-semibold text-slate-50"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {selectedPerson?.name ?? "Funcionário"}
        </Text>
        {selectedPerson?.cpf ? (
          <Text
            className="text-slate-400 text-xs mt-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            CPF: {selectedPerson.cpf}
          </Text>
        ) : null}
      </Box>
    </>
  );
}