import React from "react";
import { Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import BrandLogo from "@/components/BrandLogo";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerHeader() {
  const { headerProps } = useManagerContext();
  const { isSyncing, onSync, onLogout } = headerProps;
  return (
    <Box className="flex-row items-center justify-between">
      <BrandLogo size="sm" subtitle="Painel admin" />
      <Box className="flex-row items-center">
        <Pressable
          className={`px-3 py-2 rounded-xl mr-2 border ${
            isSyncing
              ? "bg-slate-900/40 border-slate-800 opacity-70"
              : "bg-slate-900/60 border-slate-800"
          }`}
          onPress={onSync}
          disabled={isSyncing}
        >
          <Box className="flex-row items-center">
            <Feather name="refresh-cw" size={14} color="#e2e8f0" />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              Sync
            </Text>
          </Box>
        </Pressable>
        <Pressable
          className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl"
          onPress={onLogout}
        >
          <Box className="flex-row items-center">
            <Feather name="log-out" size={14} color="#e2e8f0" />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              Sair
            </Text>
          </Box>
        </Pressable>
      </Box>
    </Box>
  );
}
