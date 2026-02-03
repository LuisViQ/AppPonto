import { useMemo } from "react";

import type {
  Employee,
  JobPosition,
  Person,
  UserAccount,
} from "@/src/databases/schemas";
import type { AccountTypeFilter } from "../utils/constants";
import {
  buildEmployeeMaps,
  buildEmployeeRows,
  buildJobPositionMaps,
  buildPersonMaps,
  buildUserAccountMaps,
  buildUserRows,
  countByType,
  countJobPositions,
  filterEmployeeRows,
  filterUserRows,
  findSelectedEmployee,
  findSelectedPerson,
} from "../utils/directoryUtils";

export function useEmployeeDirectory({
  persons,
  jobPositions,
  employees,
  userAccounts,
  searchQuery,
  typeFilter,
  jobPositionFilter,
  selectedEmployeeClientId,
  selectedPersonClientId,
}: {
  persons: Person[];
  jobPositions: JobPosition[];
  employees: Employee[];
  userAccounts: UserAccount[];
  searchQuery: string;
  typeFilter: AccountTypeFilter;
  jobPositionFilter: string;
  selectedEmployeeClientId: string | null;
  selectedPersonClientId: string | null;
}) {
  const { byClientId: personByClientId, byServerId: personByServerId } = useMemo(
    () => buildPersonMaps(persons),
    [persons],
  );

  const { byClientId: jobPositionByClientId, byServerId: jobPositionByServerId } =
    useMemo(() => buildJobPositionMaps(jobPositions), [jobPositions]);

  const {
    byPersonClientId: employeeByPersonClientId,
    byPersonServerId: employeeByPersonServerId,
  } = useMemo(() => buildEmployeeMaps(employees), [employees]);

  const {
    byPersonClientId: userAccountByPersonClientId,
    byPersonServerId: userAccountByPersonServerId,
  } = useMemo(() => buildUserAccountMaps(userAccounts), [userAccounts]);

  const employeeRows = useMemo(
    () =>
      buildEmployeeRows(
        employees,
        personByClientId,
        personByServerId,
        userAccountByPersonClientId,
        userAccountByPersonServerId,
        jobPositionByClientId,
        jobPositionByServerId,
      ),
    [
      employees,
      personByClientId,
      personByServerId,
      userAccountByPersonClientId,
      userAccountByPersonServerId,
      jobPositionByClientId,
      jobPositionByServerId,
    ],
  );

  const userRows = useMemo(
    () =>
      buildUserRows(
        persons,
        employeeByPersonClientId,
        employeeByPersonServerId,
        userAccountByPersonClientId,
        userAccountByPersonServerId,
        jobPositionByClientId,
        jobPositionByServerId,
      ),
    [
      persons,
      employeeByPersonClientId,
      employeeByPersonServerId,
      userAccountByPersonClientId,
      userAccountByPersonServerId,
      jobPositionByClientId,
      jobPositionByServerId,
    ],
  );

  const filteredEmployeeRows = useMemo(
    () =>
      filterEmployeeRows(
        employeeRows,
        searchQuery,
        typeFilter,
        jobPositionFilter,
        jobPositionByServerId,
      ),
    [
      employeeRows,
      searchQuery,
      typeFilter,
      jobPositionFilter,
      jobPositionByServerId,
    ],
  );

  const filteredUserRows = useMemo(
    () =>
      filterUserRows(
        userRows,
        searchQuery,
        typeFilter,
        jobPositionFilter,
        jobPositionByServerId,
      ),
    [
      userRows,
      searchQuery,
      typeFilter,
      jobPositionFilter,
      jobPositionByServerId,
    ],
  );

  const typeCounts = useMemo(() => countByType(userRows), [userRows]);
  const employeeTypeCounts = useMemo(() => countByType(employeeRows), [employeeRows]);
  const jobPositionCounts = useMemo(
    () => countJobPositions(employeeRows, jobPositions, jobPositionByServerId),
    [employeeRows, jobPositions, jobPositionByServerId],
  );

  const selectedEmployee = useMemo(
    () => findSelectedEmployee(employees, selectedEmployeeClientId),
    [employees, selectedEmployeeClientId],
  );

  const selectedPerson = useMemo(
    () =>
      findSelectedPerson({
        selectedPersonClientId,
        selectedEmployee,
        personByClientId,
        personByServerId,
      }),
    [
      selectedPersonClientId,
      selectedEmployee,
      personByClientId,
      personByServerId,
    ],
  );

  return {
    personByClientId,
    personByServerId,
    jobPositionByClientId,
    jobPositionByServerId,
    employeeRows,
    filteredEmployeeRows,
    userRows,
    filteredUserRows,
    typeCounts,
    employeeTypeCounts,
    jobPositionCounts,
    selectedEmployee,
    selectedPerson,
  };
}
