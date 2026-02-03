export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export const ACTION_PRIORITY: Record<string, number> = {
  PERSON_UPSERT: 1,
  USER_ACCOUNT_UPSERT: 2,
  JOB_POSITION_UPSERT: 2,
  EMPLOYEE_UPSERT: 3,
  SCHEDULE_UPSERT: 4,
  SCHEDULE_HOUR_REPLACE_DAY: 5,
  SCHEDULE_HOUR_DELETE_DAY: 6,
  SCHEDULE_HOUR_UPSERT: 6,
  SCHEDULE_HOUR_DELETE: 6,
  USER_ACCOUNT_DELETE: 90,
  JOB_POSITION_DELETE: 90,
  EMPLOYEE_DELETE: 91,
  PERSON_DELETE: 92,
};

export const ACTION_SCHEMA: Record<string, string> = {
  PERSON_UPSERT: "Person",
  USER_ACCOUNT_UPSERT: "UserAccount",
  JOB_POSITION_UPSERT: "JobPosition",
  EMPLOYEE_UPSERT: "Employee",
  SCHEDULE_UPSERT: "Schedule",
  SCHEDULE_HOUR_UPSERT: "ScheduleHour",
  SCHEDULE_HOUR_REPLACE_DAY: "ScheduleHour",
};

export const DELETE_SCHEMA: Record<string, string> = {
  USER_ACCOUNT_DELETE: "UserAccount",
  JOB_POSITION_DELETE: "JobPosition",
  EMPLOYEE_DELETE: "Employee",
  PERSON_DELETE: "Person",
  SCHEDULE_HOUR_DELETE: "ScheduleHour",
};

export const PUSH_BATCH_SIZE = 100;
export const PULL_BATCH_SIZE = 200;
export const PULL_YIELD_MS = 0;

export const PUSH_ERROR_MESSAGES: Record<string, string> = {
  duplicate_cpf: "CPF ja cadastrado no servidor",
  duplicate_registration: "Matricula ja cadastrada no servidor",
  duplicate_username: "Usuario ja cadastrado no servidor",
  duplicate_schedule_hour: "Horario ja cadastrado no servidor",
  job_position_in_use: "Cargo em uso por funcionario",
};
