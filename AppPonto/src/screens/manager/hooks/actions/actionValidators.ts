import type Realm from "realm";

import type {
  Employee,
  JobPosition,
  Person,
  UserAccount,
} from "@/src/databases/schemas";
import type { ManagerState } from "../useManagerState";

export const createActionValidators = (args: {
  realm: Realm;
  state: ManagerState;
}) => {
  const { realm, state } = args;
  const { feedback, limits } = state;

  const hasDuplicateCpf = (cpf: string, ignoreClientId?: string) => {
    const trimmed = cpf.trim();
    if (!trimmed) {
      return false;
    }
    const results = ignoreClientId
      ? realm
          .objects<Person>("Person")
          .filtered(
            'cpf == $0 AND client_id != $1 AND sync_status != "DELETED"',
            trimmed,
            ignoreClientId,
          )
      : realm
          .objects<Person>("Person")
          .filtered('cpf == $0 AND sync_status != "DELETED"', trimmed);
    return results.length > 0;
  };

  const hasDuplicateRegistration = (
    registration: string,
    ignoreClientId?: string,
  ) => {
    const trimmed = registration.trim();
    if (!trimmed) {
      return false;
    }
    const results = ignoreClientId
      ? realm
          .objects<Employee>("Employee")
          .filtered(
            'registration_number == $0 AND client_id != $1 AND sync_status != "DELETED"',
            trimmed,
            ignoreClientId,
          )
      : realm
          .objects<Employee>("Employee")
          .filtered(
            'registration_number == $0 AND sync_status != "DELETED"',
            trimmed,
          );
    return results.length > 0;
  };

  const normalizeJobName = (value: string) =>
    value.trim().toLowerCase().replace(/\\s+/g, " ");

  const hasDuplicateJobPositionName = (
    name: string,
    ignoreClientId?: string,
  ) => {
    const normalized = normalizeJobName(name);
    if (!normalized) {
      return false;
    }
    const results = ignoreClientId
      ? realm
          .objects<JobPosition>("JobPosition")
          .filtered('sync_status != "DELETED" AND client_id != $0', ignoreClientId)
      : realm
          .objects<JobPosition>("JobPosition")
          .filtered('sync_status != "DELETED"');

    for (const item of results) {
      if (!item.name) {
        continue;
      }
      if (normalizeJobName(item.name) === normalized) {
        return true;
      }
    }
    return false;
  };

  const hasDuplicateUsername = (username: string, ignoreClientId?: string) => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      return false;
    }
    const results = ignoreClientId
      ? realm
          .objects<UserAccount>("UserAccount")
          .filtered(
            'sync_status != "DELETED" AND client_id != $0',
            ignoreClientId,
          )
      : realm
          .objects<UserAccount>("UserAccount")
          .filtered('sync_status != "DELETED"');
    for (const account of results) {
      if (!account.username) {
        continue;
      }
      if (account.username.toLowerCase() === trimmed) {
        return true;
      }
    }
    return false;
  };

  const validateBasePerson = (name: string, cpf: string, ignoreClientId?: string) => {
    if (!name || !cpf) {
      feedback.setError("Informe nome e CPF");
      return false;
    }
    if (cpf.length !== limits.cpf) {
      feedback.setError("CPF deve ter 11 digitos");
      return false;
    }
    if (hasDuplicateCpf(cpf, ignoreClientId)) {
      feedback.setError("CPF ja cadastrado");
      return false;
    }
    return true;
  };

  const validateEmployeePart = (
    registration: string,
    jobPositionId: string | null,
    ignoreClientId?: string,
  ) => {
    if (!registration) {
      feedback.setError("Informe a matrícula");
      return false;
    }
    if (!jobPositionId) {
      feedback.setError("Selecione o cargo");
      return false;
    }
    if (hasDuplicateRegistration(registration, ignoreClientId)) {
      feedback.setError("Matrícula ja cadastrada");
      return false;
    }
    return true;
  };

  const validateAccount = (
    username: string,
    password: string,
    ignoreClientId?: string,
    requiresPassword = true,
  ) => {
    if (!username || username.length < 3) {
      feedback.setError("Informe um usuario valido");
      return false;
    }
    if (requiresPassword && !password) {
      feedback.setError("Informe a senha");
      return false;
    }
    if (hasDuplicateUsername(username, ignoreClientId)) {
      feedback.setError("Usuario ja cadastrado");
      return false;
    }
    return true;
  };

  return {
    hasDuplicateCpf,
    hasDuplicateRegistration,
    hasDuplicateJobPositionName,
    hasDuplicateUsername,
    validateBasePerson,
    validateEmployeePart,
    validateAccount,
  };
};
