const { query } = require('../../../core/db');
const { nowIso, parseSince } = require('../../utils/time');
const { getUserAccountColumns } = require('./helpers');

module.exports = async function syncPull(req, res) {
  const since = parseSince(req.query?.since);
  const serverTime = nowIso();
  try {
    const userAccountColumns = await getUserAccountColumns();
    const userAccountSelect = userAccountColumns.has('account_type')
      ? 'SELECT user_id AS server_id, person_id AS person_server_id, username, account_type, is_active, updated_at FROM user_account WHERE updated_at >= ? ORDER BY updated_at ASC'
      : 'SELECT user_id AS server_id, person_id AS person_server_id, username, is_active, updated_at FROM user_account WHERE updated_at >= ? ORDER BY updated_at ASC';

    const data = {
      person: await query(
        'SELECT person_id AS server_id, cpf, name, updated_at FROM person WHERE updated_at >= ? ORDER BY updated_at ASC',
        [since],
      ),
      user_account: await query(userAccountSelect, [since]),
      job_position: await query(
        'SELECT job_position_id AS server_id, name, description, updated_at FROM job_position WHERE updated_at >= ? ORDER BY updated_at ASC',
        [since],
      ),
      employee: await query(
        'SELECT employee_id AS server_id, person_id AS person_server_id, registration_number, job_position_id AS job_position_server_id, updated_at FROM employee WHERE updated_at >= ? ORDER BY updated_at ASC',
        [since],
      ),
      schedule: await query(
        'SELECT schedule_id AS server_id, employee_id AS employee_server_id, name, updated_at FROM schedule WHERE updated_at >= ? ORDER BY updated_at ASC',
        [since],
      ),
      schedule_hour: await query(
        `SELECT schedule_hour_id AS server_id,
          schedule_id AS schedule_server_id,
          weekday,
          FLOOR(TIME_TO_SEC(start_time) / 60) AS start_time_minutes,
          FLOOR(TIME_TO_SEC(end_time) / 60) AS end_time_minutes,
          block_type,
          notes,
          updated_at
        FROM schedule_hour
        WHERE updated_at >= ?
        ORDER BY updated_at ASC, weekday ASC`,
        [since],
      ),
    };

    res.json({ serverTime, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'pull_failed' });
  }
};
