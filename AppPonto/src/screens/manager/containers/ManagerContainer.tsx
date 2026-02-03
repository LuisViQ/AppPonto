import React, { useEffect, useMemo, useState } from "react";

import { useRealm } from "@/src/databases/RealmProvider";
import { AppMeta } from "@/src/databases/schemas";
import { getMetaNumber, getMetaValue, META_KEYS } from "@/src/services/appMetaService";
import ManagerLayout from "../layout/ManagerLayout";
import { useEmployeeDirectory } from "../hooks/useEmployeeDirectory";
import { useManagerActions } from "../hooks/useManagerActions";
import { useManagerState } from "../hooks/useManagerState";
import { useRealmCollections } from "../hooks/useRealmCollections";
import { useScheduleData } from "../hooks/useScheduleData";
import { formatTimeFromMinutes } from "../utils/utils";
import { ManagerProvider } from "../context/ManagerContext";
import {
  buildCreateJobPositionProps,
  buildCreatePersonProps,
  buildDashboardProps,
  buildDetailProps,
  buildHeaderProps,
  buildHomeProps,
  buildSearchProps,
  buildUsersBulkProps,
  buildUsersListProps,
  getActiveTab,
} from "../utils/managerContainerHelpers";

export default function ManagerContainer() {
  const realm = useRealm();
  const state = useManagerState();
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() =>
    getMetaValue(realm, META_KEYS.lastSyncAt),
  );
  const currentUserServerId = getMetaNumber(realm, META_KEYS.userServerId);
  const currentUsername = getMetaValue(realm, META_KEYS.username);
  const {
    view,
    feedback,
    selection,
    filters,
    personForm,
    jobPositionForm,
    editForm,
    userAccount,
    schedule,
    bulk,
  } = state;

  const { persons, jobPositions, userAccounts, employees, schedules, scheduleHours } =
    useRealmCollections(realm);

  const {
    jobPositionByClientId,
    employeeRows,
    filteredEmployeeRows,
    userRows,
    filteredUserRows,
    typeCounts,
    employeeTypeCounts,
    jobPositionCounts,
    selectedEmployee,
    selectedPerson,
  } = useEmployeeDirectory({
    persons,
    jobPositions,
    employees,
    userAccounts,
    searchQuery: filters.searchQuery,
    typeFilter: filters.typeFilter,
    jobPositionFilter: filters.jobPositionFilter,
    selectedEmployeeClientId: selection.selectedEmployeeClientId,
    selectedPersonClientId: selection.selectedPersonClientId,
  });

  const { weekStats, selectedDayDetails, selectedDayTotalMinutes } = useScheduleData({
    schedules,
    scheduleHours,
    selectedEmployee,
    selectedWeekday: schedule.selectedWeekday,
  });
  const safeSelectedDayDetails = useMemo(
    () => selectedDayDetails.filter((item) => (item?.isValid ? item.isValid() : true)),
    [selectedDayDetails],
  );

  const bulkTargetRows = filteredEmployeeRows;

  const selectedUserAccount = useMemo(() => {
    if (!selectedPerson) {
      return null;
    }
    return (
      userAccounts.find(
        (account) =>
          account.person_client_id === selectedPerson.client_id ||
          (selectedPerson.server_id !== undefined &&
            account.person_server_id === selectedPerson.server_id),
      ) ?? null
    );
  }, [userAccounts, selectedPerson]);

  const currentUserAccount = useMemo(() => {
    if (currentUserServerId !== null) {
      return (
        userAccounts.find((account) => account.server_id === currentUserServerId) ??
        null
      );
    }
    if (currentUsername) {
      return userAccounts.find((account) => account.username === currentUsername) ?? null;
    }
    return null;
  }, [userAccounts, currentUserServerId, currentUsername]);

  const isSelfSelected = useMemo(() => {
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
  }, [
    selectedPerson,
    selectedUserAccount,
    currentUserAccount,
    currentUserServerId,
    currentUsername,
  ]);

  const actions = useManagerActions({
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
  });

  useEffect(() => {
    if (!selection.selectedJobPositionId && jobPositions.length > 0) {
      selection.setSelectedJobPositionId(jobPositions[0].client_id);
    }
  }, [jobPositions, selection.selectedJobPositionId]);

  useEffect(() => {
    if (!selectedEmployee) {
      schedule.setSelectedWeekday(null);
      return;
    }
    const weekday = new Date().getDay();
    schedule.setSelectedWeekday(weekday);
    schedule.setCreateWeekday(weekday);
  }, [selectedEmployee]);

  useEffect(() => {
    const results = realm
      .objects<AppMeta>("AppMeta")
      .filtered("key == $0", META_KEYS.lastSyncAt);
    const update = () => {
      setLastSyncAt(getMetaValue(realm, META_KEYS.lastSyncAt));
    };
    update();
    results.addListener(update);
    return () => {
      results.removeListener(update);
    };
  }, [realm]);

  useEffect(() => {
    if (schedule.selectedWeekday === null) {
      return;
    }
    if (safeSelectedDayDetails.length === 0) {
      const fallback = schedule.defaultRanges?.[0] ?? {
        startTime: "08:00",
        endTime: "17:00",
      };
      schedule.setEditStartTime(fallback.startTime);
      schedule.setEditEndTime(fallback.endTime);
      return;
    }
    const first = safeSelectedDayDetails[0];
    schedule.setEditStartTime(formatTimeFromMinutes(first.start_time_minutes));
    schedule.setEditEndTime(formatTimeFromMinutes(first.end_time_minutes));
  }, [schedule.selectedWeekday, safeSelectedDayDetails, schedule.defaultRanges]);

  useEffect(() => {
    if (!selectedPerson) {
      editForm.setEditPersonName("");
      editForm.setEditPersonCpf("");
      return;
    }
    editForm.setEditPersonName(selectedPerson.name);
    editForm.setEditPersonCpf(selectedPerson.cpf);
  }, [selectedPerson]);

  useEffect(() => {
    if (!selectedEmployee) {
      editForm.setEditRegistrationNumber("");
      editForm.setEditJobPositionId(null);
      return;
    }
    editForm.setEditRegistrationNumber(selectedEmployee.registration_number);
    const jobId =
      selectedEmployee.job_position_client_id ??
      (selectedEmployee.job_position_server_id !== undefined
        ? jobPositions.find(
            (position) => position.server_id === selectedEmployee.job_position_server_id,
          )?.client_id
        : null);
    editForm.setEditJobPositionId(jobId ?? null);
  }, [selectedEmployee, jobPositions]);

  useEffect(() => {
    if (!selectedUserAccount) {
      userAccount.setUserUsername("");
      userAccount.setUserPassword("");
      userAccount.setUserIsActive(true);
      return;
    }
    userAccount.setUserUsername(selectedUserAccount.username);
    userAccount.setUserPassword("");
    userAccount.setUserIsActive(Boolean(selectedUserAccount.is_active));
  }, [selectedUserAccount]);

  const header = buildHeaderProps({
    feedback,
    actions,
    viewMode: view.viewMode,
  });

  const activeTab = getActiveTab(view.viewMode);

  const searchProps = buildSearchProps({
    filters,
    typeCounts,
    jobPositions,
    jobPositionCounts,
    filteredUserRows,
    actions,
  });

  const usersListProps = buildUsersListProps({
    filters,
    typeCounts,
    jobPositions,
    jobPositionCounts,
    userRows,
    filteredUserRows,
    actions,
  });

  const usersBulkProps = buildUsersBulkProps({
    feedback,
    filters,
    jobPositions,
    jobPositionCounts,
    employeeTypeCounts,
    bulkTargetCount: bulkTargetRows.length,
    bulk,
    actions,
  });

  const detailProps = buildDetailProps({
    feedback,
    schedule,
    selectedEmployee,
    selectedPerson,
    safeSelectedDayDetails,
    selectedDayTotalMinutes,
    weekStats,
    actions,
    editForm,
    userAccount,
    jobPositions,
    selectedUserAccount,
    isSelfSelected,
  });

  const homeProps = buildHomeProps({
    actions,
    lastSyncAt,
    feedback,
  });

  const dashboardProps = buildDashboardProps({
    actions,
    lastSyncAt,
    feedback,
    typeCounts,
    jobPositionsLength: jobPositions.length,
  });

  const createPersonProps = buildCreatePersonProps({
    actions,
    feedback,
    personForm,
    jobPositions,
    selection,
  });

  const createJobPositionProps = buildCreateJobPositionProps({
    actions,
    feedback,
    jobPositionForm,
    jobPositions,
  });

  const handleTabChange = (tab: "home" | "create" | "users") => {
    if (tab === "home") {
      actions.handleGoHome();
    } else if (tab === "create") {
      actions.handleGoCreate();
    } else {
      actions.handleGoUsers();
    }
  };

  return (
    <ManagerProvider
      value={{
        layout: {
          viewMode: view.viewMode,
          activeTab,
          message: feedback.message,
          error: feedback.error,
          showDetail: Boolean(selectedPerson),
          onTabChange: handleTabChange,
        },
        headerProps: header,
        homeProps,
        dashboardProps,
        searchProps,
        usersListProps,
        usersBulkProps,
        detailProps,
        createPersonProps,
        createJobPositionProps,
      }}
    >
      <ManagerLayout />
    </ManagerProvider>
  );
}
