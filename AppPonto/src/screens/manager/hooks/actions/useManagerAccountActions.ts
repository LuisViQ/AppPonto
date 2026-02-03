import type Realm from "realm";

import type { Person, UserAccount } from "@/src/databases/schemas";
import { enqueue } from "@/src/services/outboxService";
import { uuid } from "@/src/utils/uuid";
import type { ManagerState } from "../useManagerState";
import type { createActionValidators } from "./actionValidators";

type ValidatorSet = ReturnType<typeof createActionValidators>;

export const useManagerAccountActions = (args: {
  realm: Realm;
  state: ManagerState;
  selectedPerson: Person | null;
  selectedUserAccount: UserAccount | null;
  isSelfSelected: () => boolean;
  validators: ValidatorSet;
  resetFeedback: () => void;
}) => {
  const {
    realm,
    state,
    selectedPerson,
    selectedUserAccount,
    isSelfSelected,
    validators,
    resetFeedback,
  } = args;
  const { userAccount, feedback } = state;

  const handleAdminAccessChange = (nextValue: boolean) => {
    resetFeedback();

    if (!selectedPerson) {
      feedback.setError("Selecione um usuário");
      return;
    }

    if (nextValue) {
      userAccount.setShowUserAccountForm(true);
      userAccount.setUserIsActive(true);
      return;
    }

    if (isSelfSelected()) {
      feedback.setError("Você não pode remover o proprio acesso");
      return;
    }

    const now = new Date();
    realm.write(() => {
      if (selectedUserAccount) {
        selectedUserAccount.account_type = "EMPLOYEE";
        selectedUserAccount.is_active = false;
        selectedUserAccount.local_updated_at = now;
        selectedUserAccount.sync_status = "DIRTY" as never;
        enqueue(realm, "USER_ACCOUNT_UPSERT", {
          client_id: selectedUserAccount.client_id,
          server_id: selectedUserAccount.server_id,
          person_client_id: selectedUserAccount.person_client_id,
          person_server_id: selectedUserAccount.person_server_id,
          username: selectedUserAccount.username,
          account_type: "EMPLOYEE",
          is_active: false,
        });
      }
    });

    userAccount.setUserIsActive(false);
    userAccount.setShowUserAccountForm(false);
    feedback.setMessage("Acesso desativado");
  };

  const handleUpsertUserAccount = () => {
    resetFeedback();
    if (!selectedPerson) {
      feedback.setError("Selecione um usuário");
      return;
    }

    const username = userAccount.userUsername.trim();
    const password = userAccount.userPassword.trim();
    const mustHavePassword = !selectedUserAccount;
    if (
      !validators.validateAccount(
        username,
        password,
        selectedUserAccount?.client_id,
        mustHavePassword,
      )
    ) {
      return;
    }

    const now = new Date();
    let accountClientId = selectedUserAccount?.client_id ?? null;

    realm.write(() => {
      if (selectedUserAccount) {
        selectedUserAccount.username = username;
        selectedUserAccount.account_type = userAccount.userIsActive
          ? "BOTH"
          : "EMPLOYEE";
        selectedUserAccount.is_active = userAccount.userIsActive;
        selectedUserAccount.local_updated_at = now;
        selectedUserAccount.sync_status = "DIRTY" as never;
      } else {
        accountClientId = uuid();
        realm.create<UserAccount>("UserAccount", {
          client_id: accountClientId,
          person_client_id: selectedPerson.client_id,
          person_server_id: selectedPerson.server_id,
          username,
          account_type: userAccount.userIsActive ? "BOTH" : "EMPLOYEE",
          is_active: userAccount.userIsActive,
          local_updated_at: now,
          sync_status: "DIRTY",
        });
      }

      const payload: Record<string, unknown> = {
        client_id: accountClientId ?? selectedUserAccount?.client_id,
        server_id: selectedUserAccount?.server_id,
        person_client_id: selectedPerson.client_id,
        person_server_id: selectedPerson.server_id,
        username,
        account_type: userAccount.userIsActive ? "BOTH" : "EMPLOYEE",
        is_active: userAccount.userIsActive,
      };
      if (password) {
        payload.password = password;
      }
      enqueue(realm, "USER_ACCOUNT_UPSERT", payload);
    });

    userAccount.setUserPassword("");
    feedback.setMessage(
      selectedUserAccount ? "Acesso atualizado" : "Acesso criado",
    );
  };

  const handleDeleteUserAccount = () => {
    resetFeedback();
    if (!selectedUserAccount) {
      feedback.setError("Nenhum acesso cadastrado");
      return;
    }
    if (isSelfSelected()) {
      feedback.setError("Você não pode remover o proprio acesso");
      return;
    }

    realm.write(() => {
      selectedUserAccount.sync_status = "DELETED" as never;
      selectedUserAccount.local_updated_at = new Date();
      enqueue(realm, "USER_ACCOUNT_DELETE", {
        client_id: selectedUserAccount.client_id,
        server_id: selectedUserAccount.server_id,
        person_client_id: selectedUserAccount.person_client_id,
        person_server_id: selectedUserAccount.person_server_id,
      });
    });

    userAccount.setUserUsername("");
    userAccount.setUserPassword("");
    userAccount.setUserIsActive(true);
    feedback.setMessage("Acesso removido");
  };

  return {
    handleAdminAccessChange,
    handleUpsertUserAccount,
    handleDeleteUserAccount,
  };
};
