import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import BrandLogo from "@/components/BrandLogo";
import { useRealm } from "@/src/databases/RealmProvider";
import { login } from "@/src/services/authService";
import { useKeyboardInset } from "@/src/utils/useKeyboardInset";

export default function LoginScreen() {
  const realm = useRealm();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyboardHeight = useKeyboardInset();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const trimmedUser = username.trim();
      if (!trimmedUser || trimmedUser.length < 3) {
        setError("Informe um usu�rio valido");
        return;
      }
      if (!password || password.length < 4) {
        setError("Informe uma senha valida");
        return;
      }
      await login(realm, trimmedUser, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao entrar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 24 + keyboardHeight,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Box className="flex-1 px-6 pt-6 pb-4">
            <Box className="flex-1 justify-center">
              <Box className="mb-8">
                <BrandLogo size="lg" subtitle="Controle de horários" />
                <Text className="text-slate-400 mt-4">
                  Acesse o painel para gerenciar horários.
                </Text>
              </Box>

              <Box className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800">
                <Text className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                  Login
                </Text>
                <Box className="flex-row items-center bg-slate-950 rounded-xl px-3 py-2 border border-slate-800 mb-3">
                  <Feather name="user" size={16} color="#94a3b8" />
                  <TextInput
                    className="flex-1 text-slate-50 ml-2 placeholder:text-slate-500"
                    placeholder="Usuário"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    maxLength={60}
                    onChangeText={setUsername}
                  />
                </Box>
                <Box className="flex-row items-center bg-slate-950 rounded-xl px-3 py-2 border border-slate-800 mb-4">
                  <Feather name="lock" size={16} color="#94a3b8" />
                  <TextInput
                    className="flex-1 text-slate-50 ml-2 placeholder:text-slate-500"
                    placeholder="Senha"
                    secureTextEntry
                    value={password}
                    maxLength={64}
                    onChangeText={setPassword}
                  />
                </Box>

                <Pressable
                  className={`bg-sky-500/80 py-3 rounded-xl items-center ${
                    loading ? "opacity-70" : ""
                  }`}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#f8fafc" />
                  ) : (
                    <Text className="text-slate-50 font-semibold">Entrar</Text>
                  )}
                </Pressable>

                {error ? (
                  <Box className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                    <Text className="text-rose-200 text-xs">{error}</Text>
                  </Box>
                ) : null}
              </Box>
            </Box>

            <Box className="items-center pb-2">
              <Text className="text-slate-500 text-xs">
                Dica: use seu usuário e senha cadastrados pelo admin.
              </Text>
              <Text className="text-slate-600 text-[11px] mt-2">
                AppPonto • Painel de horários
              </Text>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
