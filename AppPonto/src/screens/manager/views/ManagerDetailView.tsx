import React from "react";
import { Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import DetailHeader from "../detail/DetailHeader";
import DetailQuickActions from "../detail/DetailQuickActions";
import DetailPersonForm from "../detail/DetailPersonForm";
import DetailUserAccountForm from "../detail/DetailUserAccountForm";
import DetailScheduleView from "../detail/DetailScheduleView";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerDetailView() {
  const { detailProps } = useManagerContext();
  const {
    message,
    error,
    canDeleteUser,
    selectedPerson,
    canEditSchedule,
    selectedWeekday,
    weekStats,
    selectedDayDetails,
    selectedDayTotalMinutes,
    editingScheduleHourId,
    showCreateDayForm,
    showDefaultForm,
    showEditForm,
    onToggleCreateDayForm,
    onToggleDefaultForm,
    onToggleEditForm,
    onDeleteDay,
    onBack,
    onToday,
    onSelectDay,
    onAddDay,
    onEditScheduleHour,
    onDeleteScheduleHour,
    createDay,
    defaultSchedule,
    editDay,
    editPerson,
    userAccount,
  } = detailProps as any;
  return (
    <>
      <DetailHeader selectedPerson={selectedPerson} onBack={onBack} />

      <DetailQuickActions
        canEditSchedule={canEditSchedule}
        canDeleteUser={canDeleteUser}
        onToggleDefaultForm={onToggleDefaultForm}
        onToggleEditPerson={editPerson.onToggle}
        onToggleUserAccount={userAccount.onToggle}
        onToday={onToday}
        onDeleteUser={editPerson.onDeletePerson}
      />

      {!canEditSchedule ? (
        <Box className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
          <Box className="flex-row items-start">
            <Feather name="info" size={14} color="#f59e0b" />
            <Text className="text-amber-100 text-xs ml-2 flex-1">
              Este usuário ainda não é funcionário. Para liberar horários,
              altere o tipo para Funcionário e informe matrícula + cargo.
            </Text>
          </Box>
        </Box>
      ) : null}

      <DetailPersonForm
        show={editPerson.show}
        canDeleteUser={canDeleteUser}
        message={message}
        error={error}
        name={editPerson.name}
        onNameChange={editPerson.onNameChange}
        cpf={editPerson.cpf}
        onCpfChange={editPerson.onCpfChange}
        registrationNumber={editPerson.registrationNumber}
        onRegistrationChange={editPerson.onRegistrationChange}
        jobPositions={editPerson.jobPositions}
        jobPositionId={editPerson.jobPositionId}
        onJobPositionChange={editPerson.onJobPositionChange}
        isAdmin={editPerson.isAdmin}
        onManageAdmin={editPerson.onManageAdmin}
        onSubmit={editPerson.onSubmit}
        onDeletePerson={editPerson.onDeletePerson}
      />

      <DetailUserAccountForm
        show={userAccount.show}
        message={message}
        error={error}
        username={userAccount.username}
        onUsernameChange={userAccount.onUsernameChange}
        password={userAccount.password}
        onPasswordChange={userAccount.onPasswordChange}
        isActive={userAccount.isActive}
        onToggleActive={userAccount.onToggleActive}
        hasAccount={userAccount.hasAccount}
        onSubmit={userAccount.onSubmit}
        onDelete={userAccount.onDelete}
      />

      <DetailScheduleView
        message={message}
        error={error}
        canEditSchedule={canEditSchedule}
        selectedWeekday={selectedWeekday}
        weekStats={weekStats}
        selectedDayDetails={selectedDayDetails}
        selectedDayTotalMinutes={selectedDayTotalMinutes}
        editingScheduleHourId={editingScheduleHourId}
        showCreateDayForm={showCreateDayForm}
        showDefaultForm={showDefaultForm}
        showEditForm={showEditForm}
        onToggleCreateDayForm={onToggleCreateDayForm}
        onToggleDefaultForm={onToggleDefaultForm}
        onToggleEditForm={onToggleEditForm}
        onDeleteDay={onDeleteDay}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
        onEditScheduleHour={onEditScheduleHour}
        onDeleteScheduleHour={onDeleteScheduleHour}
        createDay={createDay}
        defaultSchedule={defaultSchedule}
        editDay={editDay}
      />
    </>
  );
}
