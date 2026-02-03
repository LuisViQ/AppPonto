import React from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";

import { Box } from "@/components/ui/box";

type DetailUserAccountFormProps = {
  show: boolean;
  message?: string | null;
  error?: string | null;
  username: string;
  onUsernameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
  hasAccount: boolean;
  onSubmit: () => void;
  onDelete: () => void;
};

export default function DetailUserAccountForm({
  show,
  message,
  error,
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  isActive,
  onToggleActive,
  hasAccount,
  onSubmit,
  onDelete,
}: DetailUserAccountFormProps) {
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

  return (
    <>
      <Text className="mt-5 text-xs uppercase tracking-widest text-slate-400">
        Acesso login
      </Text>
      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-2 border border-slate-800">
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Usuário"
          value={username}
          maxLength={40}
          onChangeText={onUsernameChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder={hasAccount ? "Nova senha (opcional)" : "Senha"}
          secureTextEntry
          value={password}
          maxLength={64}
          onChangeText={onPasswordChange}
        />
        <Pressable
          className={`px-3 py-2 rounded-lg mb-3 ${
            isActive ? "bg-emerald-500/20" : "bg-slate-800"
          }`}
          onPress={onToggleActive}
        >
          <Text className="text-slate-200 text-xs font-semibold">
            {isActive ? "Usuário ativo" : "Usuário inativo"}
          </Text>
        </Pressable>
        <Pressable
          className="bg-sky-500/80 py-3 rounded-xl items-center"
          onPress={onSubmit}
        >
          <Text className="text-slate-50 font-semibold">
            {hasAccount ? "Salvar acesso" : "Criar acesso"}
          </Text>
        </Pressable>
        {inlineMessage(message)}
        {inlineError(error)}
        {hasAccount ? (
          <Pressable
            className="bg-rose-500/20 py-3 rounded-lg items-center mt-2"
            onPress={() =>
              Alert.alert(
                "Remover acesso",
                "Deseja remover o acesso de login?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Remover",
                    style: "destructive",
                    onPress: onDelete,
                  },
                ],
              )
            }
          >
            <Text className="text-rose-200 font-semibold">
              Remover acesso
            </Text>
          </Pressable>
        ) : null}
      </Box>
    </>
  );
}