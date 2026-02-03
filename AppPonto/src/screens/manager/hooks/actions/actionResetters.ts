import type { ManagerState } from "../useManagerState";

export const createActionResetters = (state: ManagerState) => {
  const { view, feedback, selection, schedule, bulk, editForm, userAccount } = state;

  const resetFeedback = () => {
    feedback.setMessage(null);
    feedback.setError(null);
  };

  const resetScheduleForms = () => {
    schedule.setShowCreateDayForm(false);
    schedule.setShowDefaultForm(false);
    schedule.setShowEditForm(false);
    schedule.setEditingScheduleHourId(null);
  };

  const resetBulkForms = () => {
    bulk.setShowBulkCreateDayForm(false);
    bulk.setShowBulkDefaultForm(false);
    bulk.setShowBulkEditForm(false);
  };

  const resetDetailForms = () => {
    editForm.setShowEditPersonForm(false);
    userAccount.setShowUserAccountForm(false);
  };

  const resetAllForms = () => {
    resetScheduleForms();
    resetBulkForms();
    resetDetailForms();
  };

  const resetSelection = () => {
    selection.setSelectedEmployeeClientId(null);
    selection.setSelectedPersonClientId(null);
  };

  const goToView = (nextView: ManagerState["view"]["viewMode"]) => {
    view.setViewMode(nextView);
  };

  return {
    resetFeedback,
    resetScheduleForms,
    resetBulkForms,
    resetDetailForms,
    resetAllForms,
    resetSelection,
    goToView,
  };
};
