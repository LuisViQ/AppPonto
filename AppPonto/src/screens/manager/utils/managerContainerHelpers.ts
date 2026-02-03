import type { ScheduleHour, JobPosition, Person, Employee, UserAccount } from "@/src/databases/schemas";
import type { ManagerState } from "../hooks/useManagerState";
import { formatTimeFromMinutes, formatTimeMask } from "./utils";

export function maskTime(setter: (value: string) => void) {
  return (value: string) => setter(formatTimeMask(value));
}

export function getActiveTab(viewMode: ManagerState["view"]["viewMode"]) {
  if (viewMode === "home") {
    return "home" as const;
  }
  if (viewMode === "create" || viewMode === "create-person" || viewMode === "create-job-position") {
    return "create" as const;
  }
  return "users" as const;
}

export function buildHeaderProps({
  feedback,
  actions,
  viewMode,
}: {
  feedback: ManagerState["feedback"];
  actions: {
    handleManualSync: () => void;
    handleToggleSearch: () => void;
    handleLogout: () => void;
  };
  viewMode: ManagerState["view"]["viewMode"];
}) {
  return {
    isSyncing: feedback.isSyncing,
    onSync: actions.handleManualSync,
    onSearch: actions.handleToggleSearch,
    isSearchActive: viewMode === "search",
    onLogout: actions.handleLogout,
  };
}

export function buildSearchProps({
  filters,
  typeCounts,
  jobPositions,
  jobPositionCounts,
  filteredUserRows,
  actions,
}: {
  filters: ManagerState["filters"];
  typeCounts: Record<string, number>;
  jobPositions: JobPosition[];
  jobPositionCounts: Record<string, number>;
  filteredUserRows: Array<unknown>;
  actions: { handleCloseSearch: () => void; handleSelectUser: (row: any) => void };
}) {
  return {
    onBack: actions.handleCloseSearch,
    searchQuery: filters.searchQuery,
    onSearchQueryChange: filters.handleSearchQueryChange,
    typeFilter: filters.typeFilter,
    typeCounts,
    onTypeFilterChange: filters.setTypeFilter,
    jobPositions,
    jobPositionFilter: filters.jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange: filters.setJobPositionFilter,
    filteredEmployeeRows: filteredUserRows,
    onSelectUser: actions.handleSelectUser,
  };
}

export function buildUsersListProps({
  filters,
  typeCounts,
  jobPositions,
  jobPositionCounts,
  userRows,
  filteredUserRows,
  actions,
}: {
  filters: ManagerState["filters"];
  typeCounts: Record<string, number>;
  jobPositions: JobPosition[];
  jobPositionCounts: Record<string, number>;
  userRows: Array<unknown>;
  filteredUserRows: Array<unknown>;
  actions: { handleSelectUser: (row: any) => void };
}) {
  return {
    searchQuery: filters.searchQuery,
    onSearchQueryChange: filters.handleSearchQueryChange,
    typeFilter: filters.typeFilter,
    typeCounts,
    onTypeFilterChange: filters.setTypeFilter,
    jobPositions,
    jobPositionFilter: filters.jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange: filters.setJobPositionFilter,
    employeeRows: userRows,
    filteredEmployeeRows: filteredUserRows,
    onSelectUser: actions.handleSelectUser,
  };
}

export function buildUsersBulkProps({
  feedback,
  filters,
  jobPositions,
  jobPositionCounts,
  employeeTypeCounts,
  bulkTargetCount,
  bulk,
  actions,
}: {
  feedback: ManagerState["feedback"];
  filters: ManagerState["filters"];
  jobPositions: JobPosition[];
  jobPositionCounts: Record<string, number>;
  employeeTypeCounts: Record<string, number>;
  bulkTargetCount: number;
  bulk: ManagerState["bulk"];
  actions: {
    handleBulkCreateScheduleHour: () => void;
    handleBulkApplyDefaultSchedule: () => void;
  };
}) {
  return {
    message: feedback.message,
    error: feedback.error,
    typeFilter: filters.typeFilter,
    typeCounts: employeeTypeCounts,
    onTypeFilterChange: filters.setTypeFilter,
    jobPositions,
    jobPositionFilter: filters.jobPositionFilter,
    jobPositionCounts,
    onJobPositionFilterChange: filters.setJobPositionFilter,
    bulkTargetCount,
    bulkSubmitting: bulk.bulkSubmitting,
    bulkCreate: {
      show: bulk.showBulkCreateDayForm,
      onToggle: () =>
        bulk.setShowBulkCreateDayForm((prev) => {
          const next = !prev;
          if (next) {
            bulk.setShowBulkDefaultForm(false);
            bulk.setShowBulkEditForm(false);
          }
          return next;
        }),
      weekday: bulk.bulkWeekday,
      onWeekdayChange: bulk.setBulkWeekday,
      ranges: bulk.bulkCreateRanges,
      onAddRange: () =>
        bulk.setBulkCreateRanges((prev) => [
          ...prev,
          { startTime: "08:00", endTime: "17:00" },
        ]),
      onRemoveRange: (index: number) =>
        bulk.setBulkCreateRanges((prev) =>
          prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index),
        ),
      onChangeRangeStart: (index: number, value: string) =>
        bulk.setBulkCreateRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, startTime: formatTimeMask(value) } : range,
          ),
        ),
      onChangeRangeEnd: (index: number, value: string) =>
        bulk.setBulkCreateRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, endTime: formatTimeMask(value) } : range,
          ),
        ),
      onSubmit: () => actions.handleBulkCreateScheduleHour(),
    },
    bulkDefault: {
      show: bulk.showBulkDefaultForm,
      onToggle: () =>
        bulk.setShowBulkDefaultForm((prev) => {
          const next = !prev;
          if (next) {
            bulk.setShowBulkCreateDayForm(false);
          }
          return next;
        }),
      ranges: bulk.bulkDefaultRanges,
      onAddRange: () =>
        bulk.setBulkDefaultRanges((prev) => [
          ...prev,
          { startTime: "08:00", endTime: "17:00" },
        ]),
      onRemoveRange: (index: number) =>
        bulk.setBulkDefaultRanges((prev) =>
          prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index),
        ),
      onChangeRangeStart: (index: number, value: string) =>
        bulk.setBulkDefaultRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, startTime: formatTimeMask(value) } : range,
          ),
        ),
      onChangeRangeEnd: (index: number, value: string) =>
        bulk.setBulkDefaultRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, endTime: formatTimeMask(value) } : range,
          ),
        ),
      weekdays: bulk.bulkDefaultWeekdays,
      onToggleWeekday: (index: number) =>
        bulk.setBulkDefaultWeekdays((prev) =>
          prev.map((value, idx) => (idx === index ? !value : value)),
        ),
      onSubmit: () => actions.handleBulkApplyDefaultSchedule(),
    },
  };
}

export function buildDetailProps({
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
}: {
  feedback: ManagerState["feedback"];
  schedule: ManagerState["schedule"];
  selectedEmployee: Employee | null;
  selectedPerson: Person | null;
  safeSelectedDayDetails: ScheduleHour[];
  selectedDayTotalMinutes: number;
  weekStats: any;
  actions: any;
  editForm: ManagerState["editForm"];
  userAccount: ManagerState["userAccount"];
  jobPositions: JobPosition[];
  selectedUserAccount: UserAccount | null;
  isSelfSelected: boolean;
}) {
  const accountType = (selectedUserAccount?.account_type ?? "")
    .toString()
    .trim()
    .toUpperCase();
  const isAdmin =
    accountType === "ADMIN" ||
    accountType === "BOTH" ||
    (!accountType && Boolean(selectedUserAccount?.is_active));

  return {
    message: feedback.message,
    error: feedback.error,
    canDeleteUser: !isSelfSelected,
    selectedPerson,
    selectedWeekday: schedule.selectedWeekday,
    weekStats,
    selectedDayDetails: safeSelectedDayDetails,
    selectedDayTotalMinutes,
    showCreateDayForm: schedule.showCreateDayForm,
    showDefaultForm: schedule.showDefaultForm,
    showEditForm: schedule.showEditForm,
    onToggleCreateDayForm: () => {
      schedule.setEditingScheduleHourId(null);
      schedule.setShowCreateDayForm((prev) => {
        const next = !prev;
        if (next) {
          schedule.setShowDefaultForm(false);
          schedule.setShowEditForm(false);
        }
        return next;
      });
    },
    onToggleDefaultForm: () => {
      schedule.setEditingScheduleHourId(null);
      schedule.setShowDefaultForm((prev) => {
        const next = !prev;
        if (next) {
          schedule.setShowCreateDayForm(false);
          schedule.setShowEditForm(false);
        }
        return next;
      });
    },
    onToggleEditForm: () => {
      schedule.setEditingScheduleHourId(null);
      schedule.setShowEditForm((prev) => {
        const next = !prev;
        if (next) {
          schedule.setShowCreateDayForm(false);
          schedule.setShowDefaultForm(false);
        }
        return next;
      });
    },
    onDeleteDay: actions.handleDeleteSelectedDay,
    onDeleteScheduleHour: actions.handleDeleteScheduleHour,
    onBack: actions.handleBackToList,
    onToday: actions.handleSelectToday,
    onSelectDay: (weekday: number) => {
      schedule.setSelectedWeekday(weekday);
      schedule.setCreateWeekday(weekday);
      schedule.setEditingScheduleHourId(null);
    },
    onAddDay: (weekday: number) => {
      schedule.setSelectedWeekday(weekday);
      schedule.setCreateWeekday(weekday);
      schedule.setEditingScheduleHourId(null);
      schedule.setShowCreateDayForm(true);
      schedule.setShowDefaultForm(false);
      schedule.setShowEditForm(false);
    },
    onEditScheduleHour: (hour: ScheduleHour) => {
      schedule.setSelectedWeekday(hour.weekday);
      schedule.setCreateWeekday(hour.weekday);
      schedule.setEditingScheduleHourId(hour.client_id);
      schedule.setEditStartTime(formatTimeFromMinutes(hour.start_time_minutes));
      schedule.setEditEndTime(formatTimeFromMinutes(hour.end_time_minutes));
      schedule.setShowEditForm(true);
      schedule.setShowCreateDayForm(false);
      schedule.setShowDefaultForm(false);
    },
    editingScheduleHourId: schedule.editingScheduleHourId,
    createDay: {
      weekday: schedule.createWeekday,
      onWeekdayChange: schedule.setCreateWeekday,
      startTime: schedule.newStartTime,
      onStartTimeChange: maskTime(schedule.setNewStartTime),
      endTime: schedule.newEndTime,
      onEndTimeChange: maskTime(schedule.setNewEndTime),
      onSubmit: actions.handleCreateScheduleHour,
    },
    defaultSchedule: {
      ranges: schedule.defaultRanges,
      onAddRange: () =>
        schedule.setDefaultRanges((prev) => [
          ...prev,
          { startTime: "08:00", endTime: "17:00" },
        ]),
      onRemoveRange: (index: number) =>
        schedule.setDefaultRanges((prev) =>
          prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index),
        ),
      onChangeRangeStart: (index: number, value: string) =>
        schedule.setDefaultRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, startTime: formatTimeMask(value) } : range,
          ),
        ),
      onChangeRangeEnd: (index: number, value: string) =>
        schedule.setDefaultRanges((prev) =>
          prev.map((range, idx) =>
            idx === index ? { ...range, endTime: formatTimeMask(value) } : range,
          ),
        ),
      weekdays: schedule.defaultWeekdays,
      onToggleWeekday: (index: number) =>
        schedule.setDefaultWeekdays((prev) =>
          prev.map((value, idx) => (idx === index ? !value : value)),
        ),
      onSubmit: actions.handleApplyDefaultSchedule,
    },
    editDay: {
      startTime: schedule.editStartTime,
      onStartTimeChange: maskTime(schedule.setEditStartTime),
      endTime: schedule.editEndTime,
      onEndTimeChange: maskTime(schedule.setEditEndTime),
      onSubmit: actions.handleUpdateSelectedDay,
    },
    canEditSchedule: Boolean(selectedEmployee),
    editPerson: {
      show: editForm.showEditPersonForm,
      onToggle: () => editForm.setShowEditPersonForm((prev) => !prev),
      name: editForm.editPersonName,
      onNameChange: editForm.handleEditPersonNameChange,
      cpf: editForm.editPersonCpf,
      onCpfChange: editForm.handleEditPersonCpfChange,
      registrationNumber: editForm.editRegistrationNumber,
      onRegistrationChange: editForm.handleEditRegistrationChange,
      jobPositions,
      jobPositionId: editForm.editJobPositionId,
      onJobPositionChange: editForm.setEditJobPositionId,
      isAdmin,
      onManageAdmin: actions.handleAdminAccessChange,
      onSubmit: actions.handleUpdatePersonAndEmployee,
      onDeleteEmployee: actions.handleDeleteEmployee,
      onDeletePerson: actions.handleDeletePerson,
    },
    userAccount: {
      show: userAccount.showUserAccountForm,
      onToggle: () => userAccount.setShowUserAccountForm((prev) => !prev),
      username: userAccount.userUsername,
      onUsernameChange: userAccount.handleUserUsernameChange,
      password: userAccount.userPassword,
      onPasswordChange: userAccount.handleUserPasswordChange,
      isActive: userAccount.userIsActive,
      onToggleActive: () => userAccount.setUserIsActive((prev) => !prev),
      hasAccount: Boolean(selectedUserAccount),
      onSubmit: actions.handleUpsertUserAccount,
      onDelete: actions.handleDeleteUserAccount,
    },
  };
}

export function buildHomeProps({
  actions,
  lastSyncAt,
  feedback,
}: {
  actions: any;
  lastSyncAt: string | null;
  feedback: ManagerState["feedback"];
}) {
  return {
    onCreatePerson: actions.handleOpenCreatePerson,
    onCreateJobPosition: actions.handleOpenCreateJobPosition,
    onSync: actions.handleManualSync,
    lastSyncAt,
    isSyncing: feedback.isSyncing,
  };
}

export function buildDashboardProps({
  actions,
  lastSyncAt,
  feedback,
  typeCounts,
  jobPositionsLength,
}: {
  actions: any;
  lastSyncAt: string | null;
  feedback: ManagerState["feedback"];
  typeCounts: Record<string, number>;
  jobPositionsLength: number;
}) {
  return {
    onSync: actions.handleManualSync,
    lastSyncAt,
    isSyncing: feedback.isSyncing,
    totalUsers: typeCounts.ALL,
    totalAdmins: typeCounts.ADMIN,
    totalEmployees: typeCounts.EMPLOYEE,
    totalJobs: jobPositionsLength,
  };
}

export function buildCreatePersonProps({
  actions,
  feedback,
  personForm,
  jobPositions,
  selection,
}: {
  actions: any;
  feedback: ManagerState["feedback"];
  personForm: ManagerState["personForm"];
  jobPositions: JobPosition[];
  selection: ManagerState["selection"];
}) {
  return {
    message: feedback.message,
    error: feedback.error,
    onBack: actions.handleGoCreate,
    personName: personForm.personName,
    onPersonNameChange: personForm.handlePersonNameChange,
    personCpf: personForm.personCpf,
    onPersonCpfChange: personForm.handlePersonCpfChange,
    personIsAdmin: personForm.personIsAdmin,
    onAdminAccessChange: (value: boolean) => {
      personForm.setPersonIsAdmin(value);
      if (value) {
        personForm.setPersonAdminIsActive(true);
      }
    },
    adminUsername: personForm.personAdminUsername,
    onAdminUsernameChange: personForm.handlePersonAdminUsernameChange,
    adminPassword: personForm.personAdminPassword,
    onAdminPasswordChange: personForm.handlePersonAdminPasswordChange,
    adminIsActive: personForm.personAdminIsActive,
    onToggleAdminIsActive: () =>
      personForm.setPersonAdminIsActive((prev: boolean) => !prev),
    registrationNumber: personForm.registrationNumber,
    onRegistrationNumberChange: personForm.handleRegistrationChange,
    jobPositions,
    selectedJobPositionId: selection.selectedJobPositionId,
    onSelectedJobPositionChange: selection.setSelectedJobPositionId,
    onSubmit: actions.handleCreatePerson,
  };
}

export function buildCreateJobPositionProps({
  actions,
  feedback,
  jobPositionForm,
  jobPositions,
}: {
  actions: any;
  feedback: ManagerState["feedback"];
  jobPositionForm: ManagerState["jobPositionForm"];
  jobPositions: JobPosition[];
}) {
  return {
    message: feedback.message,
    error: feedback.error,
    onBack: actions.handleGoCreate,
    jobPositionName: jobPositionForm.jobPositionName,
    onJobPositionNameChange: jobPositionForm.handleJobPositionNameChange,
    jobPositionDescription: jobPositionForm.jobPositionDescription,
    onJobPositionDescriptionChange: jobPositionForm.handleJobPositionDescriptionChange,
    onSubmit: actions.handleCreateJobPosition,
    jobPositions,
    onDeleteJobPosition: actions.handleDeleteJobPosition,
    onUpdateJobPosition: actions.handleUpdateJobPosition,
  };
}
