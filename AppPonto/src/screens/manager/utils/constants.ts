import type { Employee, Person } from "@/src/databases/schemas";

export type AccountTypeName = "ADMIN" | "EMPLOYEE" | "BOTH";
export type AccountTypeFilter = "ALL" | "ADMIN" | "EMPLOYEE";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type EmployeeRow = {
  employee: Employee;
  person: Person;
  accountType: AccountTypeName;
  jobPositionName?: string;
  isAdmin: boolean;
};

export type UserRow = {
  person: Person;
  employee: Employee | null;
  accountType: AccountTypeName;
  jobPositionName?: string;
  isAdmin: boolean;
  hasEmployee: boolean;
};

export const WEEKDAYS: { value: Weekday; label: string; short: string }[] = [
  { value: 1, label: "Segunda", short: "SEG" },
  { value: 2, label: "Terca", short: "TER" },
  { value: 3, label: "Quarta", short: "QUA" },
  { value: 4, label: "Quinta", short: "QUI" },
  { value: 5, label: "Sexta", short: "SEX" },
  { value: 6, label: "Sabado", short: "SAB" },
  { value: 0, label: "Domingo", short: "DOM" },
];

export const ACCOUNT_TYPES: AccountTypeName[] = ["ADMIN", "EMPLOYEE", "BOTH"];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeName, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Funcionario",
  BOTH: "Admin + Funcionario",
};

export const ACCOUNT_FILTER_LABELS: Record<AccountTypeFilter, string> = {
  ALL: "Todos",
  ADMIN: "Admin",
  EMPLOYEE: "Funcionario",
};
