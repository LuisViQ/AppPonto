import type {
  Employee,
  JobPosition,
  Person,
  UserAccount,
} from "@/src/databases/schemas";
import type {
  EmployeeRow,
  UserRow,
  AccountTypeFilter,
  AccountTypeName,
} from "./constants";

export function buildPersonMaps(persons: Person[]) {
  const byClientId = new Map<string, Person>();
  const byServerId = new Map<number, Person>();
  persons.forEach((person) => {
    byClientId.set(person.client_id, person);
    if (typeof person.server_id === "number") {
      byServerId.set(person.server_id, person);
    }
  });
  return { byClientId, byServerId };
}

export function buildUserAccountMaps(userAccounts: UserAccount[]) {
  const byPersonClientId = new Map<string, UserAccount>();
  const byPersonServerId = new Map<number, UserAccount>();
  userAccounts.forEach((account) => {
    if (account.person_client_id) {
      byPersonClientId.set(account.person_client_id, account);
    }
    if (typeof account.person_server_id === "number") {
      byPersonServerId.set(account.person_server_id, account);
    }
  });
  return { byPersonClientId, byPersonServerId };
}

function resolveIsAdmin(account: UserAccount | null | undefined) {
  if (!account) {
    return false;
  }
  const raw = (account.account_type ?? "").toString().trim().toUpperCase();
  if (raw === "ADMIN" || raw === "BOTH") {
    return true;
  }
  if (!raw && account.is_active) {
    return true;
  }
  return false;
}

export function buildJobPositionMaps(jobPositions: JobPosition[]) {
  const byClientId = new Map<string, JobPosition>();
  const byServerId = new Map<number, JobPosition>();
  jobPositions.forEach((position) => {
    byClientId.set(position.client_id, position);
    if (typeof position.server_id === "number") {
      byServerId.set(position.server_id, position);
    }
  });
  return { byClientId, byServerId };
}

export function buildEmployeeMaps(employees: Employee[]) {
  const byPersonClientId = new Map<string, Employee>();
  const byPersonServerId = new Map<number, Employee>();
  employees.forEach((employee) => {
    if (employee.person_client_id) {
      byPersonClientId.set(employee.person_client_id, employee);
    }
    if (typeof employee.person_server_id === "number") {
      byPersonServerId.set(employee.person_server_id, employee);
    }
  });
  return { byPersonClientId, byPersonServerId };
}

export function resolveJobPositionName(
  employee: Employee,
  jobPositionByClientId: Map<string, JobPosition>,
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const direct = employee.job_position_name_cache;
  if (direct) {
    return direct;
  }
  if (employee.job_position_client_id) {
    const position = jobPositionByClientId.get(employee.job_position_client_id);
    if (position?.name) {
      return position.name;
    }
  }
  if (typeof employee.job_position_server_id === "number") {
    const position = jobPositionByServerId.get(employee.job_position_server_id);
    if (position?.name) {
      return position.name;
    }
  }
  return null;
}

export function buildEmployeeRows(
  employees: Employee[],
  personByClientId: Map<string, Person>,
  personByServerId: Map<number, Person>,
  userAccountByPersonClientId: Map<string, UserAccount>,
  userAccountByPersonServerId: Map<number, UserAccount>,
  jobPositionByClientId: Map<string, JobPosition>,
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const rows = employees
    .map((employee) => {
      const person = employee.person_client_id
        ? personByClientId.get(employee.person_client_id)
        : typeof employee.person_server_id === "number"
          ? personByServerId.get(employee.person_server_id)
          : undefined;
      if (!person) {
        return null;
      }
      const account =
        (person.client_id &&
          userAccountByPersonClientId.get(person.client_id)) ??
        (typeof person.server_id === "number"
          ? userAccountByPersonServerId.get(person.server_id)
          : undefined) ??
        null;
      const isAdmin = resolveIsAdmin(account);
      const accountType: AccountTypeName = isAdmin ? "BOTH" : "EMPLOYEE";
      const jobPositionName =
        resolveJobPositionName(
          employee,
          jobPositionByClientId,
          jobPositionByServerId,
        ) ?? undefined;
      return { employee, person, accountType, jobPositionName, isAdmin };
    })
    .filter((item): item is EmployeeRow => Boolean(item));

  rows.sort((a, b) => a.person.name.localeCompare(b.person.name));
  return rows;
}

export function buildUserRows(
  persons: Person[],
  employeeByPersonClientId: Map<string, Employee>,
  employeeByPersonServerId: Map<number, Employee>,
  userAccountByPersonClientId: Map<string, UserAccount>,
  userAccountByPersonServerId: Map<number, UserAccount>,
  jobPositionByClientId: Map<string, JobPosition>,
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const rows = persons.map((person) => {
    const employee =
      (person.client_id && employeeByPersonClientId.get(person.client_id)) ??
      (typeof person.server_id === "number"
        ? employeeByPersonServerId.get(person.server_id)
        : undefined) ??
      null;
    const account =
      (person.client_id &&
        userAccountByPersonClientId.get(person.client_id)) ??
      (typeof person.server_id === "number"
        ? userAccountByPersonServerId.get(person.server_id)
        : undefined) ??
      null;
    const isAdmin = resolveIsAdmin(account);
    const accountType: AccountTypeName = isAdmin
      ? employee
        ? "BOTH"
        : "ADMIN"
      : "EMPLOYEE";
    const jobPositionName = employee
      ? resolveJobPositionName(
          employee,
          jobPositionByClientId,
          jobPositionByServerId,
        ) ?? undefined
      : undefined;
    const hasEmployee = Boolean(employee);
    return { person, employee, accountType, jobPositionName, isAdmin, hasEmployee };
  });
  rows.sort((a, b) => a.person.name.localeCompare(b.person.name));
  return rows;
}

export function filterEmployeeRows(
  employeeRows: EmployeeRow[],
  searchQuery: string,
  typeFilter: AccountTypeFilter,
  jobPositionFilter: string,
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const query = searchQuery.trim().toLowerCase();
  const byType =
    typeFilter === "ALL"
      ? employeeRows
      : typeFilter === "ADMIN"
        ? employeeRows.filter((row) => row.isAdmin)
        : typeFilter === "EMPLOYEE"
          ? employeeRows
          : [];
  const byJob =
    jobPositionFilter === "ALL"
      ? byType
      : byType.filter((row) => {
          const fromClient = row.employee.job_position_client_id;
          const fromServer =
            typeof row.employee.job_position_server_id === "number"
              ? jobPositionByServerId.get(row.employee.job_position_server_id)
                  ?.client_id
              : undefined;
          return (fromClient ?? fromServer) === jobPositionFilter;
        });
  if (!query) {
    return byJob;
  }
  return byJob.filter(({ person, employee, jobPositionName }) => {
    const name = person.name.toLowerCase();
    const cpf = person.cpf.toLowerCase();
    const registration = employee.registration_number.toLowerCase();
    const jobName = (jobPositionName ?? "").toLowerCase();
    return (
      name.includes(query) ||
      cpf.includes(query) ||
      registration.includes(query) ||
      jobName.includes(query)
    );
  });
}

export function filterUserRows(
  userRows: UserRow[],
  searchQuery: string,
  typeFilter: AccountTypeFilter,
  jobPositionFilter: string,
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const query = searchQuery.trim().toLowerCase();
  const byType =
    typeFilter === "ALL"
      ? userRows
      : typeFilter === "ADMIN"
        ? userRows.filter((row) => row.isAdmin)
        : typeFilter === "EMPLOYEE"
          ? userRows.filter((row) => row.hasEmployee)
          : [];
  const byJob =
    jobPositionFilter === "ALL"
      ? byType
      : byType.filter((row) => {
          if (!row.employee) {
            return true;
          }
          const fromClient = row.employee.job_position_client_id;
          const fromServer =
            typeof row.employee.job_position_server_id === "number"
              ? jobPositionByServerId.get(row.employee.job_position_server_id)
                  ?.client_id
              : undefined;
          return (fromClient ?? fromServer) === jobPositionFilter;
        });
  if (!query) {
    return byJob;
  }
  return byJob.filter(({ person, employee, jobPositionName }) => {
    const name = person.name.toLowerCase();
    const cpf = person.cpf.toLowerCase();
    const registration = employee?.registration_number?.toLowerCase() ?? "";
    const jobName = (jobPositionName ?? "").toLowerCase();
    return (
      name.includes(query) ||
      cpf.includes(query) ||
      registration.includes(query) ||
      jobName.includes(query)
    );
  });
}

export function countByType(
  rows: Array<{
    accountType: AccountTypeName;
    isAdmin?: boolean;
    hasEmployee?: boolean;
  }>,
) {
  let admin = 0;
  let employee = 0;
  rows.forEach((row) => {
    const isAdmin =
      row.isAdmin ?? (row.accountType === "ADMIN" || row.accountType === "BOTH");
    const hasEmployee =
      row.hasEmployee ??
      (row.accountType === "EMPLOYEE" || row.accountType === "BOTH");
    if (isAdmin) {
      admin += 1;
    }
    if (hasEmployee) {
      employee += 1;
    }
  });
  return {
    ALL: rows.length,
    ADMIN: admin,
    EMPLOYEE: employee,
  };
}

export function countJobPositions(
  employeeRows: EmployeeRow[],
  jobPositions: JobPosition[],
  jobPositionByServerId: Map<number, JobPosition>,
) {
  const counts: Record<string, number> = { ALL: employeeRows.length };
  jobPositions.forEach((position) => {
    counts[position.client_id] = 0;
  });
  employeeRows.forEach((row) => {
    const key =
      row.employee.job_position_client_id ??
      (typeof row.employee.job_position_server_id === "number"
        ? jobPositionByServerId.get(row.employee.job_position_server_id)
            ?.client_id
        : undefined);
    if (key) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  });
  return counts;
}

export function findSelectedEmployee(
  employees: Employee[],
  selectedEmployeeClientId: string | null,
) {
  return (
    employees.find((employee) => employee.client_id === selectedEmployeeClientId) ??
    null
  );
}

export function findSelectedPerson({
  selectedPersonClientId,
  selectedEmployee,
  personByClientId,
  personByServerId,
}: {
  selectedPersonClientId: string | null;
  selectedEmployee: Employee | null;
  personByClientId: Map<string, Person>;
  personByServerId: Map<number, Person>;
}) {
  if (selectedPersonClientId) {
    return personByClientId.get(selectedPersonClientId) ?? null;
  }
  if (!selectedEmployee) {
    return null;
  }
  if (selectedEmployee.person_client_id) {
    return personByClientId.get(selectedEmployee.person_client_id) ?? null;
  }
  if (typeof selectedEmployee.person_server_id === "number") {
    return personByServerId.get(selectedEmployee.person_server_id) ?? null;
  }
  return null;
}
