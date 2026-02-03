import React from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_FILTER_LABELS,
  type AccountTypeFilter,
} from "../utils/constants";
import { useManagerContext } from "../context/ManagerContext";

const TYPE_FILTERS: AccountTypeFilter[] = ["ALL", "ADMIN", "EMPLOYEE"];

export default function ManagerSearchView() {
  const { searchProps } = useManagerContext();
  const {
    onBack,
    searchQuery,
    onSearchQueryChange,
    typeFilter,
    typeCounts,
    onTypeFilterChange,
    jobPositions,
    jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange,
    filteredEmployeeRows,
    onSelectUser,
  } = searchProps;
  const typeOptions = TYPE_FILTERS.map((type) => ({
    value: type,
    label: `${ACCOUNT_FILTER_LABELS[type]} (${typeCounts[type]})`,
  }));

  const jobPositionOptions = [
    { value: "ALL", label: `Todos cargos (${jobPositionCounts.ALL ?? 0})` },
    ...jobPositions.map((position) => ({
      value: position.client_id,
      label: position.name,
      description: position.description ?? undefined,
    })),
  ];

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
        Pesquisa de usuários
      </Text>
      <Text className="text-slate-400 text-xs mt-1">
        Encontre por nome, CPF, matrícula ou cargo.
      </Text>

      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-3 border border-slate-800">
        <Text className="text-slate-400 text-xs mb-2">Busca rapida</Text>
        <Box className="flex-row items-center bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
          <Feather name="search" size={14} color="#94a3b8" />
          <TextInput
            className="flex-1 text-slate-50 ml-2 placeholder:text-slate-500"
            placeholder="Digite para buscar"
            value={searchQuery}
            maxLength={60}
            onChangeText={onSearchQueryChange}
          />
        </Box>
        <Box className="mt-2 self-start rounded-full bg-slate-800 px-3 py-1">
          <Text className="text-slate-300 text-[11px] font-semibold">
            {filteredEmployeeRows.length} resultado(s)
          </Text>
        </Box>

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
      </Box>

      <Text className="mt-5 text-xs uppercase tracking-widest text-slate-500">
        Resultados
      </Text>

      {filteredEmployeeRows.length === 0 ? (
        <Text className="text-slate-400 mt-2">Nenhum resultado</Text>
      ) : (
        filteredEmployeeRows.map((row) => (
          <Pressable
            key={row.employee?.client_id ?? row.person.client_id}
            className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800"
            onPress={() => onSelectUser(row)}
          >
            <Box className="flex-row items-center justify-between">
              <Box className="flex-1 pr-3">
                <Box className="flex-row items-center">
                  <Feather name="user" size={16} color="#e2e8f0" />
                  <Text
                    className="text-slate-50 font-semibold ml-2"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.person.name}
                  </Text>
                </Box>
                <Text
                  className="text-slate-400 text-xs mt-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  CPF: {row.person.cpf}
                </Text>
                <Text
                  className="text-slate-400 text-xs mt-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Matrícula: {row.employee?.registration_number ?? "—"}
                </Text>
                {row.jobPositionName ? (
                  <Text
                    className="text-slate-400 text-xs mt-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Cargo: {row.jobPositionName}
                  </Text>
                ) : null}
                <Text className="text-slate-500 text-[10px] mt-1">
                  Conta: {ACCOUNT_TYPE_LABELS[row.accountType]}
                </Text>
              </Box>
              <Box className="flex-row items-center">
                <Text className="text-sky-400 text-xs font-semibold">
                  Abrir
                </Text>
                <Feather name="chevron-right" size={14} color="#38bdf8" />
              </Box>
            </Box>
          </Pressable>
        ))
      )}
    </>
  );
}
