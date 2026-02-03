import React from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerHomeView() {
  const { homeProps } = useManagerContext();
  const { onCreatePerson, onCreateJobPosition, onSync, lastSyncAt, isSyncing } =
    homeProps;
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
        <Text className="text-xl font-semibold text-slate-50">
          Criar registros
        </Text>
        <Text className="text-slate-400 text-xs mt-2">
          Cadastre usuários e cargos rapidamente.
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

      <Box className="mt-6">
        <Text className="text-xs uppercase tracking-widest text-slate-500">
          Ações rapidas
        </Text>
        <Box className="mt-3">
          <Pressable
            className="bg-slate-900/70 rounded-2xl p-4 mb-3 border border-slate-800"
            onPress={onCreatePerson}
          >
            <Box className="flex-row items-center justify-between">
              <Box className="flex-row items-center">
                <Feather name="user-plus" size={18} color="#e2e8f0" />
                <Text className="text-slate-50 font-semibold ml-3">
                  Cadastrar usuário
                </Text>
              </Box>
              <Feather name="chevron-right" size={16} color="#94a3b8" />
            </Box>
            <Text className="text-slate-400 text-xs mt-2">
              Admin ou funcionário com matrícula e cargo.
            </Text>
          </Pressable>

          <Pressable
            className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800"
            onPress={onCreateJobPosition}
          >
            <Box className="flex-row items-center justify-between">
              <Box className="flex-row items-center">
                <Feather name="briefcase" size={18} color="#e2e8f0" />
                <Text className="text-slate-50 font-semibold ml-3">
                  Cadastrar cargo / Editar cargo
                </Text>
              </Box>
              <Feather name="chevron-right" size={16} color="#94a3b8" />
            </Box>
            <Text className="text-slate-400 text-xs mt-2">
              Crie ou edite cargos para usar no cadastro de funcionários.
            </Text>
          </Pressable>
        </Box>
      </Box>
    </>
  );
}
