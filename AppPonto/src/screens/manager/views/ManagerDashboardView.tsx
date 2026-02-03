import React from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerDashboardView() {
  const { dashboardProps } = useManagerContext();
  const {
    onSync,
    lastSyncAt,
    isSyncing,
    totalUsers,
    totalAdmins,
    totalEmployees,
    totalJobs,
  } = dashboardProps;
  const parsedSync = lastSyncAt ? new Date(lastSyncAt) : null;
  const formattedSync =
    parsedSync && !Number.isNaN(parsedSync.getTime())
      ? parsedSync.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const statusLabel = isSyncing
    ? "Sincronizando..."
    : formattedSync
      ? `Atualizado em ${formattedSync}`
      : "Nunca sincronizado";
  const statusDot = isSyncing
    ? "bg-amber-400"
    : formattedSync
      ? "bg-emerald-400"
      : "bg-slate-500";

  return (
    <>
      <Box className="mt-6">
        <Text className="text-xl font-semibold text-slate-50">Home</Text>
        <Text className="text-slate-400 text-xs mt-2">
          Visao geral do painel.
        </Text>
        <Box className="mt-4 bg-slate-900/70 rounded-2xl px-4 py-3 border border-slate-800 flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Box className={`h-2 w-2 rounded-full ${statusDot}`} />
            <Text className="text-slate-300 text-[11px] ml-2">
              {statusLabel}
            </Text>
          </Box>
          <Pressable
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800"
            onPress={onSync}
            disabled={isSyncing}
          >
            <Text className="text-[11px] text-slate-200 font-semibold">
              {isSyncing ? "Aguarde" : "Atualizar"}
            </Text>
          </Pressable>
        </Box>
      </Box>

      <Text className="mt-6 text-xs uppercase tracking-widest text-slate-500">
        Resumo
      </Text>
      <Box className="mt-3">
        <Box className="bg-slate-900/70 rounded-2xl p-4 mb-3 border border-slate-800 flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Feather name="users" size={16} color="#e2e8f0" />
            <Text className="text-slate-50 font-semibold ml-2">Usuários</Text>
          </Box>
          <Text className="text-slate-100 font-semibold">{totalUsers}</Text>
        </Box>
        <Box className="bg-slate-900/70 rounded-2xl p-4 mb-3 border border-slate-800 flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Feather name="shield" size={16} color="#e2e8f0" />
            <Text className="text-slate-50 font-semibold ml-2">Admins</Text>
          </Box>
          <Text className="text-slate-100 font-semibold">{totalAdmins}</Text>
        </Box>
        <Box className="bg-slate-900/70 rounded-2xl p-4 mb-3 border border-slate-800 flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Feather name="user-check" size={16} color="#e2e8f0" />
            <Text className="text-slate-50 font-semibold ml-2">
              Funcionários
            </Text>
          </Box>
          <Text className="text-slate-100 font-semibold">{totalEmployees}</Text>
        </Box>
        <Box className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800 flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Feather name="briefcase" size={16} color="#e2e8f0" />
            <Text className="text-slate-50 font-semibold ml-2">Cargos</Text>
          </Box>
          <Text className="text-slate-100 font-semibold">{totalJobs}</Text>
        </Box>
      </Box>
    </>
  );
}
