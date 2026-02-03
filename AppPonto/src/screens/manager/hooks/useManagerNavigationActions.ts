import type { Employee } from "@/src/databases/schemas";
import type { UserRow } from "../utils/constants";
import type { ManagerState } from "./useManagerState";
import { createActionResetters } from "./actions/actionResetters";

export const useManagerNavigationActions = (state: ManagerState) => {
  const { selection, personForm } = state;
  const {
    resetFeedback,
    resetAllForms,
    resetDetailForms,
    resetBulkForms,
    resetSelection,
    goToView,
  } = createActionResetters(state);

  const handleSelectEmployee = (employee: Employee) => {
    selection.setSelectedEmployeeClientId(employee.client_id);
    selection.setSelectedPersonClientId(null);
    goToView("main");
    resetAllForms();
    resetFeedback();
  };

  const handleSelectUser = (row: UserRow) => {
    if (row.employee) {
      selection.setSelectedEmployeeClientId(row.employee.client_id);
    } else {
      selection.setSelectedEmployeeClientId(null);
    }
    selection.setSelectedPersonClientId(row.person.client_id);
    goToView("main");
    resetAllForms();
    resetFeedback();
  };

  const handleBackToList = () => {
    resetSelection();
    goToView("main");
    resetDetailForms();
    resetBulkForms();
    resetFeedback();
  };

  const handleGoHome = () => {
    resetSelection();
    goToView("home");
    resetAllForms();
    resetFeedback();
  };

  const handleGoCreate = () => {
    resetSelection();
    goToView("create");
    resetAllForms();
    resetFeedback();
  };

  const handleGoUsers = () => {
    resetSelection();
    goToView("main");
    resetAllForms();
  };

  const handleOpenCreatePerson = () => {
    resetFeedback();
    resetSelection();
    personForm.setPersonIsAdmin(false);
    personForm.setPersonAdminIsActive(true);
    goToView("create-person");
  };

  const handleOpenCreateJobPosition = () => {
    resetFeedback();
    resetSelection();
    goToView("create-job-position");
  };

  const handleToggleSearch = () => {
    resetFeedback();
    if (state.view.viewMode === "search") {
      goToView("main");
      return;
    }
    resetSelection();
    goToView("search");
  };

  const handleCloseSearch = () => {
    goToView("main");
  };

  return {
    handleSelectEmployee,
    handleSelectUser,
    handleBackToList,
    handleGoHome,
    handleGoCreate,
    handleGoUsers,
    handleOpenCreatePerson,
    handleOpenCreateJobPosition,
    handleToggleSearch,
    handleCloseSearch,
  };
};
