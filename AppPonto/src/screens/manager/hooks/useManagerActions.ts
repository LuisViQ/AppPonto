import type Realm from "realm";

import type {
  Employee,
  JobPosition,
  Person,
  UserAccount,
} from "@/src/databases/schemas";
import { logout } from "@/src/services/authService";
import { syncNow } from "@/src/services/syncService";
import {
  createBulkScheduleHandlers,
  createScheduleHandlers,
} from "../schedule/managerScheduleHandlers";
import type { EmployeeRow } from "../utils/constants";
import type { ManagerState } from "./useManagerState";
import { createActionResetters } from "./actions/actionResetters";
import { createActionValidators } from "./actions/actionValidators";
import { useManagerAccountActions } from "./actions/useManagerAccountActions";
import { useManagerJobPositionActions } from "./actions/useManagerJobPositionActions";
import { useManagerPersonActions } from "./actions/useManagerPersonActions";
import { useManagerNavigationActions } from "./useManagerNavigationActions";

export function useManagerActions({
  realm,
  state,
  jobPositionByClientId,
  selectedEmployee,
  selectedPerson,
  selectedUserAccount,
  bulkTargetRows,
  currentUserServerId,
  currentUsername,
  currentUserAccount,
}: {
  realm: Realm;
  state: ManagerState;
  jobPositionByClientId: Map<string, JobPosition>;
  selectedEmployee: Employee | null;
  selectedPerson: Person | null;
  selectedUserAccount: UserAccount | null;
  bulkTargetRows: EmployeeRow[];
  currentUserServerId: number | null;
  currentUsername: string | null;
  currentUserAccount: UserAccount | null;
}) {
  const {
    feedback,
    schedule,
    bulk,
  } = state;

  const resetters = createActionResetters(state);
  const validators = createActionValidators({ realm, state });
  const navigationActions = useManagerNavigationActions(state);

  const isSelfSelected = () => {
    if (!selectedPerson) {
      return false;
    }
    if (
      currentUserServerId !== null &&
      selectedUserAccount?.server_id === currentUserServerId
    ) {
      return true;
    }
    if (currentUsername && selectedUserAccount?.username === currentUsername) {
      return true;
    }
    if (currentUserAccount) {
      if (
        currentUserAccount.person_client_id &&
        currentUserAccount.person_client_id === selectedPerson.client_id
      ) {
        return true;
      }
      if (
        currentUserAccount.person_server_id !== undefined &&
        selectedPerson.server_id !== undefined &&
        currentUserAccount.person_server_id === selectedPerson.server_id
      ) {
        return true;
      }
    }
    return false;
  };

  const { resetFeedback } = resetters;
  const {
    hasDuplicateJobPositionName,
    hasDuplicateRegistration,
    validateBasePerson,
    validateEmployeePart,
    validateAccount,
  } = validators;

  const scheduleHandlers = createScheduleHandlers({
    realm,
    schedule,
    feedback,
    selectedEmployee,
  });

  const bulkHandlers = createBulkScheduleHandlers({
    realm,
    bulk,
    feedback,
    bulkTargetRows,
  });

  const jobPositionActions = useManagerJobPositionActions({
    realm,
    state,
    jobPositionByClientId,
    validators,
    resetFeedback,
  });

  const personActions = useManagerPersonActions({
    realm,
    state,
    jobPositionByClientId,
    selectedEmployee,
    selectedPerson,
    selectedUserAccount,
    validators,
    resetFeedback,
    isSelfSelected,
  });

  const accountActions = useManagerAccountActions({
    realm,
    state,
    selectedPerson,
    selectedUserAccount,
    isSelfSelected,
    validators,
    resetFeedback,
  });

  const handleLogout = () => {
    logout(realm);
  };

  const handleManualSync = async () => {
    if (feedback.isSyncing) {
      return;
    }
    feedback.setError(null);
    feedback.setMessage("Sincronizando... pode demorar com muitos dados");
    feedback.setIsSyncing(true);
    try {
      const result = await syncNow(realm);
      if (result.status === "ok") {
        const base = `Sync ok: ${result.pushed} push / ${result.pulled} pull`;
        console.log(base);
        if (result.warnings && result.warnings.length > 0) {
          console.log(`Sync warnings: ${result.warnings.join(" | ")}`);
          feedback.setMessage(null);
          feedback.setError(result.warnings.join(" | "));
        } else {
          feedback.setMessage(null);
        }
        return;
      }
      if (result.status === "skipped") {
        const reasonMap = {
          offline: "sem internet",
          busy: "sync em andamento",
          missing_base_url: "API não configurada",
        } as const;
        feedback.setMessage(`Sync pulado: ${reasonMap[result.reason]}`);
        return;
      }
      feedback.setMessage(null);
      feedback.setError(result.error);
    } catch (err) {
      feedback.setMessage(null);
      feedback.setError(
        err instanceof Error ? err.message : "Erro ao sincronizar",
      );
    } finally {
      feedback.setIsSyncing(false);
    }
  };

  return {
    ...personActions,
    ...jobPositionActions,
    ...accountActions,
    ...navigationActions,
    ...scheduleHandlers,
    ...bulkHandlers,
    handleManualSync,
    handleLogout,
  };
}
