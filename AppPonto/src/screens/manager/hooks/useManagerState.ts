import { useState } from 'react';

import type { AccountTypeFilter, Weekday } from '../utils/constants';

export type ManagerState = ReturnType<typeof useManagerState>;

export function useManagerState() {
  const [viewMode, setViewMode] = useState<
    'home' | 'create' | 'main' | 'search' | 'create-person' | 'create-job-position'
  >('home');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedEmployeeClientId, setSelectedEmployeeClientId] = useState<
    string | null
  >(null);
  const [selectedPersonClientId, setSelectedPersonClientId] = useState<string | null>(
    null,
  );

  const [personName, setPersonName] = useState('');
  const [personCpf, setPersonCpf] = useState('');
  const [personIsAdmin, setPersonIsAdmin] = useState(false);
  const [personAdminUsername, setPersonAdminUsername] = useState('');
  const [personAdminPassword, setPersonAdminPassword] = useState('');
  const [personAdminIsActive, setPersonAdminIsActive] = useState(true);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [selectedJobPositionId, setSelectedJobPositionId] = useState<string | null>(
    null,
  );
  const [jobPositionFilter, setJobPositionFilter] = useState<string>('ALL');
  const [jobPositionName, setJobPositionName] = useState('');
  const [jobPositionDescription, setJobPositionDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>('ALL');

  const [showEditPersonForm, setShowEditPersonForm] = useState(false);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonCpf, setEditPersonCpf] = useState('');
  const [editRegistrationNumber, setEditRegistrationNumber] = useState('');
  const [editJobPositionId, setEditJobPositionId] = useState<string | null>(null);

  const [showUserAccountForm, setShowUserAccountForm] = useState(false);
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userIsActive, setUserIsActive] = useState(true);

  const [selectedWeekday, setSelectedWeekday] = useState<Weekday | null>(1);
  const [createWeekday, setCreateWeekday] = useState<Weekday>(1);
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('17:00');

  const [defaultWeekdays, setDefaultWeekdays] = useState<boolean[]>([
    false,
    true,
    true,
    true,
    true,
    true,
    false,
  ]);
  const [defaultRanges, setDefaultRanges] = useState<
    Array<{ startTime: string; endTime: string }>
  >([{ startTime: '08:00', endTime: '17:00' }]);

  const [editStartTime, setEditStartTime] = useState('08:00');
  const [editEndTime, setEditEndTime] = useState('17:00');
  const [editingScheduleHourId, setEditingScheduleHourId] = useState<string | null>(
    null,
  );
  const [showCreateDayForm, setShowCreateDayForm] = useState(false);
  const [showDefaultForm, setShowDefaultForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkCreateDayForm, setShowBulkCreateDayForm] = useState(false);
  const [showBulkDefaultForm, setShowBulkDefaultForm] = useState(false);
  const [showBulkEditForm, setShowBulkEditForm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [bulkWeekday, setBulkWeekday] = useState<Weekday>(1);
  const [bulkCreateRanges, setBulkCreateRanges] = useState<
    Array<{ startTime: string; endTime: string }>
  >([{ startTime: '08:00', endTime: '17:00' }]);

  const [bulkDefaultRanges, setBulkDefaultRanges] = useState<
    Array<{ startTime: string; endTime: string }>
  >([{ startTime: '08:00', endTime: '17:00' }]);
  const [bulkDefaultWeekdays, setBulkDefaultWeekdays] = useState<boolean[]>([
    false,
    true,
    true,
    true,
    true,
    true,
    false,
  ]);

  const [bulkEditWeekday, setBulkEditWeekday] = useState<Weekday>(1);
  const [bulkEditStartTime, setBulkEditStartTime] = useState('08:00');
  const [bulkEditEndTime, setBulkEditEndTime] = useState('17:00');

  const limits = {
    name: 80,
    cpf: 11,
    registration: 30,
    search: 60,
    jobPositionName: 60,
    jobPositionDescription: 120,
    username: 40,
    password: 64,
  };

  const limitText = (value: string, max: number) =>
    value.length > max ? value.slice(0, max) : value;

  const sanitizeCpf = (value: string) =>
    value.replace(/\D/g, '').slice(0, limits.cpf);

  const handleSearchQueryChange = (value: string) =>
    setSearchQuery(limitText(value, limits.search));
  const handlePersonNameChange = (value: string) =>
    setPersonName(limitText(value, limits.name));
  const handlePersonCpfChange = (value: string) => setPersonCpf(sanitizeCpf(value));
  const handlePersonAdminUsernameChange = (value: string) =>
    setPersonAdminUsername(limitText(value, limits.username));
  const handlePersonAdminPasswordChange = (value: string) =>
    setPersonAdminPassword(limitText(value, limits.password));
  const handleRegistrationChange = (value: string) =>
    setRegistrationNumber(limitText(value, limits.registration));
  const handleJobPositionNameChange = (value: string) =>
    setJobPositionName(limitText(value, limits.jobPositionName));
  const handleJobPositionDescriptionChange = (value: string) =>
    setJobPositionDescription(limitText(value, limits.jobPositionDescription));
  const handleEditPersonNameChange = (value: string) =>
    setEditPersonName(limitText(value, limits.name));
  const handleEditPersonCpfChange = (value: string) =>
    setEditPersonCpf(sanitizeCpf(value));
  const handleEditRegistrationChange = (value: string) =>
    setEditRegistrationNumber(limitText(value, limits.registration));
  const handleUserUsernameChange = (value: string) =>
    setUserUsername(limitText(value, limits.username));
  const handleUserPasswordChange = (value: string) =>
    setUserPassword(limitText(value, limits.password));

  return {
    view: { viewMode, setViewMode },
    feedback: { message, setMessage, error, setError, isSyncing, setIsSyncing },
    selection: {
      selectedEmployeeClientId,
      setSelectedEmployeeClientId,
      selectedPersonClientId,
      setSelectedPersonClientId,
      selectedJobPositionId,
      setSelectedJobPositionId,
    },
    filters: {
      searchQuery,
      setSearchQuery,
      handleSearchQueryChange,
      typeFilter,
      setTypeFilter,
      jobPositionFilter,
      setJobPositionFilter,
    },
    personForm: {
      personName,
      setPersonName,
      handlePersonNameChange,
      personCpf,
      setPersonCpf,
      handlePersonCpfChange,
      personIsAdmin,
      setPersonIsAdmin,
      personAdminUsername,
      setPersonAdminUsername,
      handlePersonAdminUsernameChange,
      personAdminPassword,
      setPersonAdminPassword,
      handlePersonAdminPasswordChange,
      personAdminIsActive,
      setPersonAdminIsActive,
      registrationNumber,
      setRegistrationNumber,
      handleRegistrationChange,
    },
    jobPositionForm: {
      jobPositionName,
      setJobPositionName,
      handleJobPositionNameChange,
      jobPositionDescription,
      setJobPositionDescription,
      handleJobPositionDescriptionChange,
    },
    editForm: {
      showEditPersonForm,
      setShowEditPersonForm,
      editPersonName,
      setEditPersonName,
      handleEditPersonNameChange,
      editPersonCpf,
      setEditPersonCpf,
      handleEditPersonCpfChange,
      editRegistrationNumber,
      setEditRegistrationNumber,
      handleEditRegistrationChange,
      editJobPositionId,
      setEditJobPositionId,
    },
    userAccount: {
      showUserAccountForm,
      setShowUserAccountForm,
      userUsername,
      setUserUsername,
      handleUserUsernameChange,
      userPassword,
      setUserPassword,
      handleUserPasswordChange,
      userIsActive,
      setUserIsActive,
    },
    schedule: {
      selectedWeekday,
      setSelectedWeekday,
      createWeekday,
      setCreateWeekday,
      newStartTime,
      setNewStartTime,
      newEndTime,
      setNewEndTime,
      defaultWeekdays,
      setDefaultWeekdays,
      defaultRanges,
      setDefaultRanges,
      editStartTime,
      setEditStartTime,
      editEndTime,
      setEditEndTime,
      editingScheduleHourId,
      setEditingScheduleHourId,
      showCreateDayForm,
      setShowCreateDayForm,
      showDefaultForm,
      setShowDefaultForm,
      showEditForm,
      setShowEditForm,
    },
    bulk: {
      showBulkCreateDayForm,
      setShowBulkCreateDayForm,
      showBulkDefaultForm,
      setShowBulkDefaultForm,
      showBulkEditForm,
      setShowBulkEditForm,
      bulkSubmitting,
      setBulkSubmitting,
      bulkWeekday,
      setBulkWeekday,
      bulkCreateRanges,
      setBulkCreateRanges,
      bulkDefaultRanges,
      setBulkDefaultRanges,
      bulkDefaultWeekdays,
      setBulkDefaultWeekdays,
      bulkEditWeekday,
      setBulkEditWeekday,
      bulkEditStartTime,
      setBulkEditStartTime,
      bulkEditEndTime,
      setBulkEditEndTime,
    },
    limits,
  };
}
