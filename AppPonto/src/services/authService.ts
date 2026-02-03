import type Realm from "realm";

import {
  clearMetaValue,
  META_KEYS,
  setMetaValue,
} from "@/src/services/appMetaService";
import { fetchWithTimeout } from "@/src/services/http";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

type LoginResponse = {
  token: string;
  expiresAt?: string;
  user?: {
    user_id?: number;
    employee_id?: number | null;
    username?: string;
  };
  serverTime?: string;
};

export async function login(
  realm: Realm,
  username: string,
  password: string,
): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    throw new Error("API não configurada");
  }

  if (!username || !password) {
    throw new Error("Informe usuário e senha");
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Credenciais invalidas");
    }
    if (response.status === 403) {
      throw new Error("Usuário inativo");
    }
    throw new Error(`Falha no login (${response.status})`);
  }

  const payload = (await response.json()) as LoginResponse;
  if (!payload.token) {
    throw new Error("Login falhou");
  }

  setMetaValue(realm, META_KEYS.authToken, payload.token);
  if (
    payload.user?.employee_id !== undefined &&
    payload.user?.employee_id !== null
  ) {
    setMetaValue(
      realm,
      META_KEYS.employeeServerId,
      String(payload.user.employee_id),
    );
  }

  if (payload.user?.user_id !== undefined && payload.user?.user_id !== null) {
    setMetaValue(realm, META_KEYS.userServerId, String(payload.user.user_id));
  }

  if (payload.user?.username) {
    setMetaValue(realm, META_KEYS.username, payload.user.username);
  }

  return payload;
}

export function logout(realm: Realm) {
  clearMetaValue(realm, META_KEYS.authToken);
  clearMetaValue(realm, META_KEYS.userServerId);
  clearMetaValue(realm, META_KEYS.employeeServerId);
  clearMetaValue(realm, META_KEYS.username);
  clearMetaValue(realm, META_KEYS.lastSyncAt);
}
