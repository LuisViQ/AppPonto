import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import SelectSheet from "@/components/SelectSheet";
import type { AccountTypeFilter, UserRow } from "../utils/constants";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_FILTER_LABELS } from "../utils/constants";
import ManagerHeader from "../layout/ManagerHeader";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerUsersListView() {
  const { usersListProps, layout } = useManagerContext();
  const {
    searchQuery,
    onSearchQueryChange,
    typeFilter,
    typeCounts,
    onTypeFilterChange,
    jobPositions,
    jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange,
    employeeRows,
    filteredEmployeeRows,
    onSelectUser,
  } = usersListProps;
  const { message, error } = layout;
  const [showFilters, setShowFilters] = useState(false);
  const data = useMemo(() => filteredEmployeeRows, [filteredEmployeeRows]);
  const typeOptions = useMemo(
    () =>
      (["ALL", "ADMIN", "EMPLOYEE"] as AccountTypeFilter[]).map((type) => ({
        value: type,
        label: `${ACCOUNT_FILTER_LABELS[type]} (${typeCounts[type] ?? 0})`,
      })),
    [typeCounts],
  );
  const jobOptions = useMemo(
    () => [
      { value: "ALL", label: `Todos (${jobPositionCounts.ALL ?? 0})` },
      ...jobPositions.map((position) => ({
        value: position.client_id,
        label: `${position.name} (${jobPositionCounts[position.client_id] ?? 0})`,
        description: position.description ?? undefined,
      })),
    ],
    [jobPositions, jobPositionCounts],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserRow }) => (
      <Pressable
        className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800"
        onPress={() => onSelectUser(item)}
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
                {item.person.name}
              </Text>
            </Box>
            <Text
              className="text-slate-400 text-xs mt-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              CPF: {item.person.cpf}
            </Text>
            <Text
              className="text-slate-400 text-xs mt-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Matrícula: {item.employee?.registration_number ?? "—"}
            </Text>
            {item.jobPositionName ? (
              <Text
                className="text-slate-400 text-xs mt-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Cargo: {item.jobPositionName}
              </Text>
            ) : null}
            <Text className="text-slate-500 text-[10px] mt-1">
              Conta: {ACCOUNT_TYPE_LABELS[item.accountType]}
            </Text>
          </Box>
          <Box className="flex-row items-center">
            <Text className="text-sky-400 text-xs font-semibold">Abrir</Text>
            <Feather name="chevron-right" size={14} color="#38bdf8" />
          </Box>
        </Box>
      </Pressable>
    ),
    [onSelectUser],
  );

  const emptyLabel =
    employeeRows.length === 0 ? "Nenhum usuário" : "Nenhum resultado";

  return (
    <Box className="flex-1">
      <Box className="px-4 pt-4">
        <ManagerHeader />
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

        <Text className="mt-5 text-xs uppercase tracking-widest text-slate-500">
          Usuários
        </Text>
        <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
          <Text className="text-slate-400 text-xs mb-2">Pesquisa rápida</Text>
          <Box className="flex-row items-center bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
            <Feather name="search" size={14} color="#94a3b8" />
            <TextInput
              className="flex-1 text-slate-50 ml-2 placeholder:text-slate-500"
              placeholder="Nome, CPF ou matrícula"
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
          <Pressable
            className="mt-3 self-start rounded-full border border-slate-800 bg-slate-900/60 px-3 py-2"
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Box className="flex-row items-center">
              <Feather name="sliders" size={14} color="#94a3b8" />
              <Text className="text-slate-200 text-xs font-semibold ml-2">
                {showFilters ? "Fechar filtros" : "Abrir filtros"}
              </Text>
            </Box>
          </Pressable>
        </Box>

        {showFilters ? (
          <>
            <Text className="mt-4 text-xs uppercase tracking-widest text-slate-500">
              Filtro por conta
            </Text>
            <Text className="text-slate-400 text-xs mt-1">
              Toque para selecionar uma conta.
            </Text>
            <Box className="mt-3">
              <SelectSheet
                label="Conta"
                value={typeFilter}
                options={typeOptions}
                onChange={onTypeFilterChange}
              />
            </Box>

            <Text className="mt-4 text-xs uppercase tracking-widest text-slate-500">
              Filtro por cargo
            </Text>
            <Text className="text-slate-400 text-xs mt-1">
              Toque para selecionar um cargo.
            </Text>
            <Box className="mt-3">
              <SelectSheet
                label="Cargo"
                value={jobPositionFilter}
                options={jobOptions}
                onChange={onJobPositionFilterChange}
              />
            </Box>
          </>
        ) : null}
      </Box>

      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.employee?.client_id ?? item.person.client_id
        }
        renderItem={renderItem}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <Text className="text-slate-400 mt-2">{emptyLabel}</Text>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: 160,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
    </Box>
  );
}
