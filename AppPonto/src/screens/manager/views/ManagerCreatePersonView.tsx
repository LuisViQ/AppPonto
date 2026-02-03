import React from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerCreatePersonView() {
  const { createPersonProps } = useManagerContext();
  const {
    message,
    error,
    onBack,
    personName,
    onPersonNameChange,
    personCpf,
    onPersonCpfChange,
    personIsAdmin,
    onAdminAccessChange,
    adminUsername,
    onAdminUsernameChange,
    adminPassword,
    onAdminPasswordChange,
    adminIsActive,
    onToggleAdminIsActive,
    registrationNumber,
    onRegistrationNumberChange,
    jobPositions,
    selectedJobPositionId,
    onSelectedJobPositionChange,
    onSubmit,
  } = createPersonProps;
  const jobPositionOptions = jobPositions.map((position) => ({
    value: position.client_id,
    label: position.name,
    description: position.description ?? undefined,
  }));

  return (
    <>
      <Pressable
        className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl mt-4 self-start"
        onPress={onBack}
      >
        <Box className="flex-row items-center">
          <Feather name="chevron-left" size={14} color="#e2e8f0" />
          <Text className="text-slate-200 text-xs font-semibold ml-2">
            Voltar
          </Text>
        </Box>
      </Pressable>

      <Text className="mt-4 text-xl font-semibold text-slate-50">
        Novo usuario
      </Text>
      <Text className="text-slate-400 text-xs mt-1">
        Cadastre pessoa e, se for funcionario, defina matricula e cargo.
      </Text>

      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-4 border border-slate-800">
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Nome"
          value={personName}
          maxLength={80}
          onChangeText={onPersonNameChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="CPF"
          value={personCpf}
          keyboardType="number-pad"
          maxLength={11}
          onChangeText={onPersonCpfChange}
        />

        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Matricula"
          value={registrationNumber}
          maxLength={30}
          onChangeText={onRegistrationNumberChange}
        />
        <SelectSheet
          label="Cargo do funcionario"
          value={selectedJobPositionId ?? ""}
          options={jobPositionOptions}
          onChange={onSelectedJobPositionChange}
          placeholder="Selecione um cargo"
        />

        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Usuario"
          value={adminUsername}
          maxLength={40}
          onChangeText={onAdminUsernameChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Senha"
          secureTextEntry
          value={adminPassword}
          maxLength={64}
          onChangeText={onAdminPasswordChange}
        />
        <Pressable
          className={`px-3 py-2 rounded-xl mb-3 border ${
            personIsAdmin
              ? "bg-emerald-500/20 border-emerald-400/40"
              : "bg-slate-900 border-slate-800"
          }`}
          onPress={() => onAdminAccessChange(!personIsAdmin)}
        >
          <Box className="flex-row items-center">
            <Feather
              name="shield"
              size={12}
              color={personIsAdmin ? "#34d399" : "#94a3b8"}
            />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              {personIsAdmin ? "Admin ativo" : "Tornar admin"}
            </Text>
          </Box>
        </Pressable>
        <Pressable
          className={`px-3 py-2 rounded-xl mb-3 ${
            adminIsActive ? "bg-emerald-500/20" : "bg-slate-900"
          }`}
          onPress={onToggleAdminIsActive}
        >
          <Text className="text-slate-200 text-xs font-semibold">
            {adminIsActive ? "Acesso ativo" : "Acesso inativo"}
          </Text>
        </Pressable>

        <Pressable
          className="bg-sky-500/80 py-3 rounded-xl items-center"
          onPress={onSubmit}
        >
          <Text className="text-slate-50 font-semibold">Salvar usuario</Text>
        </Pressable>

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
      </Box>
    </>
  );
}
