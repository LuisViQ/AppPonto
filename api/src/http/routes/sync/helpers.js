const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { query, execute } = require('../../../core/db');

let cachedJobPositionColumns = null;
let cachedUserAccountColumns = null;

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER ?? '';

function applyPepper(password) {
  return `${password}${PASSWORD_PEPPER}`;
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(applyPepper(password), salt);
}

const ACTION_PRIORITY = {
  PERSON_UPSERT: 1,
  USER_ACCOUNT_UPSERT: 2,
  JOB_POSITION_UPSERT: 2,
  EMPLOYEE_UPSERT: 3,
  SCHEDULE_UPSERT: 4,
  SCHEDULE_HOUR_REPLACE_DAY: 5,
  SCHEDULE_HOUR_DELETE_DAY: 6,
  SCHEDULE_HOUR_UPSERT: 6,
  SCHEDULE_HOUR_DELETE: 6,
  TIME_CLOCK_EVENT_CREATE: 7,
  USER_ACCOUNT_DELETE: 90,
  JOB_POSITION_DELETE: 90,
  EMPLOYEE_DELETE: 91,
  PERSON_DELETE: 92,
};

function sortActions(actions) {
  return [...actions].sort((a, b) => {
    const priorityA = ACTION_PRIORITY[a.type] ?? 99;
    const priorityB = ACTION_PRIORITY[b.type] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });
}



function parseWeekday(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  const normalized = Math.round(parsed);
  if (normalized < 0 || normalized > 6) {
    return null;
  }
  return normalized;
}

function parseMinutes(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.min(1439, Math.round(parsed)));
}

function normalizeBool(value, fallback = true) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') {
      return true;
    }
    if (normalized === '0' || normalized === 'false') {
      return false;
    }
  }
  return fallback;
}

async function resolvePersonId(payload) {
  if (payload.person_server_id) {
    return Number(payload.person_server_id);
  }
  if (payload.person_client_id) {
    const rows = await query(
      'SELECT person_id AS server_id FROM person WHERE client_id = ? LIMIT 1',
      [payload.person_client_id],
    );
    return rows[0]?.server_id ?? null;
  }
  return null;
}

async function resolveEmployeeId(payload) {
  if (payload.employee_server_id) {
    return Number(payload.employee_server_id);
  }
  if (payload.employee_client_id) {
    const rows = await query(
      'SELECT employee_id AS server_id FROM employee WHERE client_id = ? LIMIT 1',
      [payload.employee_client_id],
    );
    return rows[0]?.server_id ?? null;
  }
  return null;
}

async function resolveJobPositionId(payload) {
  const columns = await getJobPositionColumns();
  if (payload.job_position_server_id) {
    const parsed = Number(payload.job_position_server_id);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (payload.job_position_id) {
    const parsed = Number(payload.job_position_id);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (payload.client_id && columns.has('client_id')) {
    const rows = await query(
      'SELECT job_position_id AS server_id FROM job_position WHERE client_id = ? LIMIT 1',
      [payload.client_id],
    );
    return rows[0]?.server_id ?? null;
  }
  if (payload.job_position_client_id && columns.has('client_id')) {
    const rows = await query(
      'SELECT job_position_id AS server_id FROM job_position WHERE client_id = ? LIMIT 1',
      [payload.job_position_client_id],
    );
    return rows[0]?.server_id ?? null;
  }
  if (payload.name) {
    const rows = await query(
      'SELECT job_position_id AS server_id FROM job_position WHERE name = ? LIMIT 1',
      [payload.name],
    );
    return rows[0]?.server_id ?? null;
  }
  if (payload.job_position_name) {
    const rows = await query(
      'SELECT job_position_id AS server_id FROM job_position WHERE name = ? LIMIT 1',
      [payload.job_position_name],
    );
    return rows[0]?.server_id ?? null;
  }
  return null;
}

async function getJobPositionColumns() {
  if (cachedJobPositionColumns) {
    return cachedJobPositionColumns;
  }
  const rows = await query('SHOW COLUMNS FROM job_position');
  cachedJobPositionColumns = new Set(rows.map((row) => row.Field));
  return cachedJobPositionColumns;
}

async function getUserAccountColumns() {
  if (cachedUserAccountColumns) {
    return cachedUserAccountColumns;
  }
  const rows = await query('SHOW COLUMNS FROM user_account');
  cachedUserAccountColumns = new Set(rows.map((row) => row.Field));
  return cachedUserAccountColumns;
}

async function resolveUserAccountId(payload) {
  if (payload.server_id) {
    const parsed = Number(payload.server_id);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (payload.user_id) {
    const parsed = Number(payload.user_id);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const columns = await getUserAccountColumns();
  if (payload.client_id && columns.has('client_id')) {
    const rows = await query(
      'SELECT user_id AS server_id FROM user_account WHERE client_id = ? LIMIT 1',
      [payload.client_id],
    );
    return rows[0]?.server_id ?? null;
  }

  if (payload.username) {
    const rows = await query(
      'SELECT user_id AS server_id FROM user_account WHERE username = ? LIMIT 1',
      [payload.username],
    );
    return rows[0]?.server_id ?? null;
  }

  const personId = await resolvePersonId(payload);
  if (personId) {
    const rows = await query(
      'SELECT user_id AS server_id FROM user_account WHERE person_id = ? LIMIT 1',
      [personId],
    );
    return rows[0]?.server_id ?? null;
  }

  return null;
}

async function ensureDefaultJobPositionId(serverTime) {
  const defaultName = process.env.DEFAULT_JOB_POSITION_NAME || 'Sem Cargo';
  const existing = await query(
    'SELECT job_position_id AS server_id FROM job_position WHERE name = ? LIMIT 1',
    [defaultName],
  );
  if (existing[0]?.server_id) {
    return existing[0].server_id;
  }

  const columns = await getJobPositionColumns();
  const fields = ['name'];
  const values = [defaultName];

  if (columns.has('client_id')) {
    fields.push('client_id');
    values.push(crypto.randomUUID());
  }
  if (columns.has('description')) {
    fields.push('description');
    values.push('Criado automaticamente pelo sync');
  }
  if (columns.has('created_at')) {
    fields.push('created_at');
    values.push(serverTime);
  }
  if (columns.has('updated_at')) {
    fields.push('updated_at');
    values.push(serverTime);
  }

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO job_position (${fields.join(', ')}) VALUES (${placeholders})`;
  const [result] = await execute(sql, values);
  return result.insertId;
}

  async function resolveScheduleId(payload) {
    if (payload.schedule_server_id) {
      const rows = await query(
        'SELECT schedule_id AS server_id FROM schedule WHERE schedule_id = ? LIMIT 1',
        [payload.schedule_server_id],
      );
      return rows[0]?.server_id ?? null;
    }
  if (payload.schedule_client_id) {
    const rows = await query(
      'SELECT schedule_id AS server_id FROM schedule WHERE client_id = ? LIMIT 1',
      [payload.schedule_client_id],
    );
    return rows[0]?.server_id ?? null;
  }
  return null;
}

async function deleteEmployeeCascade(employeeId) {
  if (!employeeId) {
    return;
  }
  const scheduleRows = await query(
    'SELECT schedule_id AS id FROM schedule WHERE employee_id = ?',
    [employeeId],
  );
  const scheduleIds = scheduleRows.map((row) => row.id).filter(Boolean);
  if (scheduleIds.length > 0) {
    const chunkSize = 1000;
    for (let i = 0; i < scheduleIds.length; i += chunkSize) {
      const chunk = scheduleIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(', ');
      await execute(
        `DELETE FROM schedule_hour WHERE schedule_id IN (${placeholders})`,
        chunk,
      );
    }
  }
  await execute('DELETE FROM schedule WHERE employee_id = ?', [employeeId]);
  await execute('DELETE FROM employee WHERE employee_id = ?', [employeeId]);
}

module.exports = {
  deleteEmployeeCascade,
  ensureDefaultJobPositionId,
  getJobPositionColumns,
  getUserAccountColumns,
  hashPassword,
  normalizeBool,
  parseMinutes,
  parseWeekday,
  resolveEmployeeId,
  resolveJobPositionId,
  resolvePersonId,
  resolveScheduleId,
  resolveUserAccountId,
  sortActions,
};
