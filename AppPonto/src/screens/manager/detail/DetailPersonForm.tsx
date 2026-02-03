import React from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import type { JobPosition } from "@/src/databases/schemas";

type DetailPersonFormProps = {
  show: boolean;
  canDeleteUser: boolean;
  message?: string | null;
  error?: string | null;
  name: string;
  onNameChange: (value: string) => void;
  cpf: string;
  onCpfChange: (value: string) => void;
  registrationNumber: string;
  onRegistrationChange: (value: string) => void;
  jobPositions: JobPosition[];
  jobPositionId: string | null;
  onJobPositionChange: (value: string) => void;
  isAdmin: boolean;
  onManageAdmin: (value: boolean) => void;
  onSubmit: () => void;
  onDeletePerson: () => void;
};

export default function DetailPersonForm({
  show,
  canDeleteUser,
  message,
  error,
  name,
  onNameChange,
  cpf,
  onCpfChange,
  registrationNumber,
  onRegistrationChange,
  jobPositions,
  jobPositionId,
  onJobPositionChange,
  isAdmin,
  onManageAdmin,
  onSubmit,
  onDeletePerson,
}: DetailPersonFormProps) {
  if (!show) {
    return null;
  }

  const inlineMessage = (value?: string | null) =>
    value ? (
      <Box className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
        <Text className="text-sky-200 text-xs">{value}</Text>
      </Box>
    ) : null;

  const inlineError = (value?: string | null) =>
    value ? (
      <Box className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
        <Text className="text-rose-200 text-xs">{value}</Text>
      </Box>
    ) : null;

  const jobPositionOptions = jobPositions.map((position) => ({
    value: position.client_id,
    label: position.name,
    description: position.description ?? undefined,
  }));

  return (
    <>
      <Text className="mt-5 text-xs uppercase tracking-widest text-slate-400">
        Dados do usuário
      </Text>
      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Nome"
          value={name}
          maxLength={80}
          onChangeText={onNameChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="CPF"
          value={cpf}
          keyboardType="number-pad"
          maxLength={11}
          onChangeText={onCpfChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Matrícula"
          value={registrationNumber}
          maxLength={30}
          onChangeText={onRegistrationChange}
        />
        <SelectSheet
          label="Cargo do funcionário"
          value={jobPositionId ?? ""}
          options={jobPositionOptions}
          onChange={onJobPositionChange}
          placeholder="Selecione um cargo"
        />

        <Pressable
          className={`px-3 py-2 rounded-xl mb-3 border ${
            isAdmin
              ? "bg-emerald-500/20 border-emerald-400/40"
              : "bg-slate-900 border-slate-800"
          }`}
          onPress={() => onManageAdmin(!isAdmin)}
        >
          <Box className="flex-row items-center">
            <Feather
              name="check-square"
              size={12}
              color={isAdmin ? "#34d399" : "#94a3b8"}
            />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              {isAdmin ? "Acesso admin ativo" : "Liberar acesso admin"}
            </Text>
          </Box>
          <Text className="text-slate-500 text-[10px] mt-1">
            Quando desativado, o acesso fica inativo.
          </Text>
        </Pressable>

        <Pressable
          className="bg-sky-500/80 py-3 rounded-xl items-center"
          onPress={onSubmit}
        >
          <Text className="text-slate-50 font-semibold">Salvar dados</Text>
        </Pressable>
        {inlineMessage(message)}
        {inlineError(error)}

        <Text className="text-slate-500 text-xs mt-3">Ações perigosas</Text>
        <Box className="flex-row flex-wrap mt-2">
          {canDeleteUser ? (
            <Pressable
              className="bg-rose-500/80 px-3 py-2 rounded-lg mb-2 border border-rose-400/60"
              onPress={() =>
                Alert.alert(
                  "Excluir usuário",
                  "Isso remove usuário, acesso e funcionário. Deseja continuar?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Excluir",
                      style: "destructive",
                      onPress: onDeletePerson,
                    },
                  ],
                )
              }
            >
              <Text className="text-white text-xs font-semibold">
                Excluir usuário
              </Text>
            </Pressable>
          ) : (
            <Text className="text-slate-500 text-xs">
              Você não pode excluir o proprio usuário.
            </Text>
          )}
        </Box>
      </Box>
    </>
  );
}
