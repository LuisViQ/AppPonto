const { query, execute } = require('../../../core/db');
const { nowIso } = require('../../utils/time');
const {
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
} = require('./helpers');

module.exports = async function syncPush(req, res) {
  const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
  const results = [];
  const serverTime = nowIso();

  const orderedActions = sortActions(actions);

  for (const action of orderedActions) {
    if (!action || !action.id || !action.type) {
      results.push({
        id: action?.id ?? 'unknown',
        status: 'ERROR',
        error: 'invalid_action',
      });
      continue;
    }

    const payload = action.payload ?? {};

    if (action.type === 'PERSON_UPSERT') {
      const clientId = payload.client_id;
      const name = payload.name;
      const cpf = payload.cpf;

      if (!clientId || !name || !cpf) {
        results.push({ id: action.id, status: 'ERROR', error: 'missing_person_fields' });
        continue;
      }

      try {
        let serverId = payload.server_id ? Number(payload.server_id) : null;
        if (!serverId) {
          const existing = await query(
            'SELECT person_id AS server_id FROM person WHERE client_id = ? LIMIT 1',
            [clientId],
          );
          serverId = existing[0]?.server_id ?? null;
        }

        const existingCpf = await query(
          'SELECT person_id AS server_id FROM person WHERE cpf = ? LIMIT 1',
          [cpf],
        );
        const existingCpfId = existingCpf[0]?.server_id ?? null;
        if (existingCpfId && (!serverId || existingCpfId !== serverId)) {
          results.push({ id: action.id, status: 'ERROR', error: 'duplicate_cpf' });
          continue;
        }

        if (serverId) {
          await execute(
            'UPDATE person SET client_id = ?, cpf = ?, name = ?, updated_at = ? WHERE person_id = ?',
            [clientId, cpf, name, serverTime, serverId],
          );
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        const [result] = await execute(
          'INSERT INTO person (client_id, cpf, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [clientId, cpf, name, serverTime, serverTime],
        );
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        if (error && error.code === 'ER_DUP_ENTRY') {
          results.push({ id: action.id, status: 'ERROR', error: 'duplicate_cpf' });
        } else {
          results.push({ id: action.id, status: 'ERROR', error: 'CPF Duplicado' });
        }
      }
      continue;
    }

    if (action.type === 'USER_ACCOUNT_UPSERT') {
      const username = payload.username;
      const isActive = normalizeBool(payload.is_active, true);
      const accountType =
        payload.account_type ?? (isActive ? 'ADMIN' : 'EMPLOYEE');
      const personId = await resolvePersonId(payload);

      if (!username || !personId) {
        results.push({
          id: action.id,
          status: 'ERROR',
          error: 'missing_user_account_fields',
        });
        continue;
      }

      try {
        const columns = await getUserAccountColumns();
        const serverId = await resolveUserAccountId(payload);
        const password = payload.password;
        const passwordHash = password ? await hashPassword(password) : null;

        if (serverId) {
          const fields = [];
          const values = [];
          if (columns.has('client_id') && payload.client_id) {
            fields.push('client_id = ?');
            values.push(payload.client_id);
          }
          fields.push('person_id = ?');
          values.push(personId);
          fields.push('username = ?');
          values.push(username);
          if (passwordHash) {
            fields.push('password_hash = ?');
            values.push(passwordHash);
          }
          if (columns.has('account_type')) {
            fields.push('account_type = ?');
            values.push(accountType);
          }
          fields.push('is_active = ?');
          values.push(isActive ? 1 : 0);
          fields.push('updated_at = ?');
          values.push(serverTime);
          values.push(serverId);
          await execute(
            `UPDATE user_account SET ${fields.join(', ')} WHERE user_id = ?`,
            values,
          );
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        if (!passwordHash) {
          results.push({
            id: action.id,
            status: 'ERROR',
            error: 'missing_password',
          });
          continue;
        }

        const fields = ['person_id', 'username', 'password_hash', 'is_active'];
        const values = [personId, username, passwordHash, isActive ? 1 : 0];
        if (columns.has('account_type')) {
          fields.push('account_type');
          values.push(accountType);
        }
        if (columns.has('client_id') && payload.client_id) {
          fields.push('client_id');
          values.push(payload.client_id);
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
        const sql = `INSERT INTO user_account (${fields.join(', ')}) VALUES (${placeholders})`;
        const [result] = await execute(sql, values);
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'JOB_POSITION_UPSERT') {
      const clientId = payload.client_id ?? null;
      const name = payload.name;
      const description = payload.description ?? null;

      if (!name) {
        results.push({ id: action.id, status: 'ERROR', error: 'missing_job_position_fields' });
        continue;
      }

      try {
        const columns = await getJobPositionColumns();
        let serverId = payload.server_id ? Number(payload.server_id) : null;
        if (!serverId) {
          const existing =
            clientId && columns.has('client_id')
              ? await query(
                  'SELECT job_position_id AS server_id FROM job_position WHERE client_id = ? LIMIT 1',
                  [clientId],
                )
              : await query(
                  'SELECT job_position_id AS server_id FROM job_position WHERE name = ? LIMIT 1',
                  [name],
                );
          serverId = existing[0]?.server_id ?? null;
        }

        if (serverId) {
          if (columns.has('client_id')) {
            await execute(
              'UPDATE job_position SET client_id = COALESCE(?, client_id), name = ?, description = COALESCE(?, description), updated_at = ? WHERE job_position_id = ?',
              [clientId, name, description, serverTime, serverId],
            );
          } else {
            await execute(
              'UPDATE job_position SET name = ?, description = COALESCE(?, description), updated_at = ? WHERE job_position_id = ?',
              [name, description, serverTime, serverId],
            );
          }
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        const fields = ['name'];
        const values = [name];
        if (columns.has('client_id') && clientId) {
          fields.push('client_id');
          values.push(clientId);
        }
        if (columns.has('description')) {
          fields.push('description');
          values.push(description);
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
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro No Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'JOB_POSITION_DELETE') {
      try {
        const jobPositionId = await resolveJobPositionId(payload);
        if (!jobPositionId) {
          results.push({ id: action.id, status: 'OK', updated_at: serverTime });
          continue;
        }
        await execute('DELETE FROM job_position WHERE job_position_id = ?', [
          jobPositionId,
        ]);
        results.push({ id: action.id, status: 'OK', updated_at: serverTime });
      } catch (error) {
        console.error(error);
        if (error && error.code === 'ER_ROW_IS_REFERENCED_2') {
          results.push({
            id: action.id,
            status: 'ERROR',
            error: 'job_position_in_use',
          });
        } else {
          results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
        }
      }
      continue;
    }

    if (action.type === 'EMPLOYEE_UPSERT') {
      const clientId = payload.client_id;
      const registration = payload.registration_number;
      const personId = await resolvePersonId(payload);
      if (!clientId || !registration || !personId) {
        results.push({ id: action.id, status: 'ERROR', error: 'missing_employee_fields' });
        continue;
      }

      try {
        const jobPositionId = await resolveJobPositionId(payload);
        let serverId = payload.server_id ? Number(payload.server_id) : null;
        if (!serverId) {
          const existing = await query(
            'SELECT employee_id AS server_id FROM employee WHERE client_id = ? LIMIT 1',
            [clientId],
          );
          serverId = existing[0]?.server_id ?? null;
        }

        const existingRegistration = await query(
          'SELECT employee_id AS server_id FROM employee WHERE registration_number = ? LIMIT 1',
          [registration],
        );
        const existingRegId = existingRegistration[0]?.server_id ?? null;
        if (existingRegId && (!serverId || existingRegId !== serverId)) {
          results.push({
            id: action.id,
            status: 'ERROR',
            error: 'duplicate_registration',
          });
          continue;
        }

        if (serverId) {
          await execute(
            'UPDATE employee SET client_id = ?, person_id = ?, registration_number = ?, job_position_id = COALESCE(?, job_position_id), updated_at = ? WHERE employee_id = ?',
            [clientId, personId, registration, jobPositionId, serverTime, serverId],
          );
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        const ensuredJobPositionId =
          jobPositionId ?? (await ensureDefaultJobPositionId(serverTime));
        const [result] = await execute(
          'INSERT INTO employee (client_id, person_id, registration_number, job_position_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [clientId, personId, registration, ensuredJobPositionId, serverTime, serverTime],
        );
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        if (error && error.code === 'ER_DUP_ENTRY') {
          results.push({
            id: action.id,
            status: 'ERROR',
            error: 'duplicate_registration',
          });
        } else {
          results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
        }
      }
      continue;
    }

    if (action.type === 'SCHEDULE_UPSERT') {
      const clientId = payload.client_id;
      const name = payload.name ?? null;
      const employeeId = await resolveEmployeeId(payload);

      if (!clientId || !employeeId) {
        results.push({ id: action.id, status: 'ERROR', error: 'missing_schedule_fields' });
        continue;
      }

      try {
        let serverId = payload.server_id ? Number(payload.server_id) : null;
        if (!serverId) {
          const existing = await query(
            'SELECT schedule_id AS server_id FROM schedule WHERE client_id = ? LIMIT 1',
            [clientId],
          );
          serverId = existing[0]?.server_id ?? null;
        }

        if (serverId) {
          await execute(
            'UPDATE schedule SET client_id = ?, employee_id = ?, name = COALESCE(?, name), updated_at = ? WHERE schedule_id = ?',
            [clientId, employeeId, name, serverTime, serverId],
          );
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        const [result] = await execute(
          'INSERT INTO schedule (client_id, employee_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [clientId, employeeId, name, serverTime, serverTime],
        );
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'SCHEDULE_HOUR_UPSERT') {
      const clientId = payload.client_id;
      const scheduleId = await resolveScheduleId(payload);
      const hasScheduleRef =
        payload.schedule_server_id !== null &&
        payload.schedule_server_id !== undefined
          ? true
          : payload.schedule_client_id !== null &&
            payload.schedule_client_id !== undefined;
      const weekday = parseWeekday(payload.weekday);
      const blockType = payload.block_type || 'WORK';
      let startMinutes = parseMinutes(payload.start_time_minutes);
      let endMinutes = parseMinutes(payload.end_time_minutes);

      if (blockType === 'OFF') {
        startMinutes = 0;
        endMinutes = 0;
      }

      if (
        !clientId ||
        scheduleId === null ||
        weekday === null ||
        !blockType ||
        startMinutes === null ||
        endMinutes === null
      ) {
        if (scheduleId === null && hasScheduleRef) {
          results.push({ id: action.id, status: 'OK', error: 'missing_schedule' });
          continue;
        }
        results.push({ id: action.id, status: 'ERROR', error: 'missing_schedule_hour_fields' });
        continue;
      }

      const notes = payload.notes ?? null;
      const startSeconds = startMinutes * 60;
      const endSeconds = endMinutes * 60;

      try {
        let serverId = payload.server_id ? Number(payload.server_id) : null;
        if (!serverId) {
          const existing = await query(
            'SELECT schedule_hour_id AS server_id FROM schedule_hour WHERE client_id = ? LIMIT 1',
            [clientId],
          );
          serverId = existing[0]?.server_id ?? null;
        }

        if (serverId) {
          await execute(
            `UPDATE schedule_hour
              SET client_id = ?,
                  schedule_id = ?,
                  weekday = ?,
                  start_time = SEC_TO_TIME(?),
                  end_time = SEC_TO_TIME(?),
                  block_type = ?,
                  notes = ?,
                  updated_at = ?
              WHERE schedule_hour_id = ?`,
            [
              clientId,
              scheduleId,
              weekday,
              startSeconds,
              endSeconds,
              blockType,
              notes,
              serverTime,
              serverId,
            ],
          );
          results.push({
            id: action.id,
            status: 'OK',
            server_id: serverId,
            updated_at: serverTime,
          });
          continue;
        }

        const duplicate = await query(
          `SELECT schedule_hour_id AS server_id
           FROM schedule_hour
           WHERE schedule_id = ?
             AND weekday = ?
             AND start_time = SEC_TO_TIME(?)
             AND end_time = SEC_TO_TIME(?)
             AND block_type = ?
           LIMIT 1`,
          [scheduleId, weekday, startSeconds, endSeconds, blockType],
        );

        if (duplicate[0]?.server_id) {
          results.push({
            id: action.id,
            status: 'ERROR',
            error: 'duplicate_schedule_hour',
          });
          continue;
        }

        const [result] = await execute(
          `INSERT INTO schedule_hour
            (client_id, schedule_id, weekday, start_time, end_time, block_type, notes, created_at, updated_at)
          VALUES (?, ?, ?, SEC_TO_TIME(?), SEC_TO_TIME(?), ?, ?, ?, ?)`,
          [
            clientId,
            scheduleId,
            weekday,
            startSeconds,
            endSeconds,
            blockType,
            notes,
            serverTime,
            serverTime,
          ],
        );
        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'SCHEDULE_HOUR_DELETE_DAY') {
      const scheduleId = await resolveScheduleId(payload);
      const hasScheduleRef =
        payload.schedule_server_id !== null &&
        payload.schedule_server_id !== undefined
          ? true
          : payload.schedule_client_id !== null &&
            payload.schedule_client_id !== undefined;
      const weekday = parseWeekday(payload.weekday);

      if (scheduleId === null || weekday === null) {
        if (scheduleId === null && hasScheduleRef) {
          results.push({ id: action.id, status: 'OK', error: 'missing_schedule' });
          continue;
        }
        results.push({
          id: action.id,
          status: 'ERROR',
          error: 'missing_schedule_hour_fields',
        });
        continue;
      }

      try {
        await execute(
          'DELETE FROM schedule_hour WHERE schedule_id = ? AND weekday = ?',
          [scheduleId, weekday],
        );
        results.push({
          id: action.id,
          status: 'OK',
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'SCHEDULE_HOUR_DELETE') {
      const clientId = payload.client_id;
      const serverId = payload.server_id ? Number(payload.server_id) : null;

      if (!clientId && !serverId) {
        results.push({
          id: action.id,
          status: 'ERROR',
          error: 'missing_schedule_hour_fields',
        });
        continue;
      }

      try {
        let targetId = serverId;
        if (!targetId && clientId) {
          const existing = await query(
            'SELECT schedule_hour_id AS server_id FROM schedule_hour WHERE client_id = ? LIMIT 1',
            [clientId],
          );
          targetId = existing[0]?.server_id ?? null;
        }

        if (targetId) {
          await execute('DELETE FROM schedule_hour WHERE schedule_hour_id = ?', [
            targetId,
          ]);
        }

        results.push({
          id: action.id,
          status: 'OK',
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'SCHEDULE_HOUR_REPLACE_DAY') {
      const clientId = payload.client_id;
      const scheduleId = await resolveScheduleId(payload);
      const hasScheduleRef =
        payload.schedule_server_id !== null &&
        payload.schedule_server_id !== undefined
          ? true
          : payload.schedule_client_id !== null &&
            payload.schedule_client_id !== undefined;
      const weekday = parseWeekday(payload.weekday);
      const blockType = payload.block_type || 'WORK';
      let startMinutes = parseMinutes(payload.start_time_minutes);
      let endMinutes = parseMinutes(payload.end_time_minutes);

      if (blockType === 'OFF') {
        startMinutes = 0;
        endMinutes = 0;
      }

      if (
        !clientId ||
        scheduleId === null ||
        weekday === null ||
        !blockType ||
        startMinutes === null ||
        endMinutes === null
      ) {
        if (scheduleId === null && hasScheduleRef) {
          results.push({
            id: action.id,
            status: 'OK',
            error: 'missing_schedule',
          });
          continue;
        }
        results.push({
          id: action.id,
          status: 'ERROR',
          error: 'missing_schedule_hour_fields',
        });
        continue;
      }

      const notes = payload.notes ?? null;
      const startSeconds = startMinutes * 60;
      const endSeconds = endMinutes * 60;

      try {
        await execute(
          'DELETE FROM schedule_hour WHERE schedule_id = ? AND weekday = ?',
          [scheduleId, weekday],
        );

        const [result] = await execute(
          `INSERT INTO schedule_hour
            (client_id, schedule_id, weekday, start_time, end_time, block_type, notes, created_at, updated_at)
          VALUES (?, ?, ?, SEC_TO_TIME(?), SEC_TO_TIME(?), ?, ?, ?, ?)`,
          [
            clientId,
            scheduleId,
            weekday,
            startSeconds,
            endSeconds,
            blockType,
            notes,
            serverTime,
            serverTime,
          ],
        );

        results.push({
          id: action.id,
          status: 'OK',
          server_id: result.insertId,
          updated_at: serverTime,
        });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'USER_ACCOUNT_DELETE') {
      try {
        const serverId = await resolveUserAccountId(payload);
        if (!serverId) {
          results.push({ id: action.id, status: 'ERROR', error: 'missing_user_account' });
          continue;
        }
        await execute('DELETE FROM user_account WHERE user_id = ?', [serverId]);
        results.push({ id: action.id, status: 'OK', updated_at: serverTime });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'EMPLOYEE_DELETE') {
      try {
        const employeeId = await resolveEmployeeId(payload);
        if (!employeeId) {
          results.push({ id: action.id, status: 'OK', updated_at: serverTime });
          continue;
        }
        await deleteEmployeeCascade(employeeId);
        results.push({ id: action.id, status: 'OK', updated_at: serverTime });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    if (action.type === 'PERSON_DELETE') {
      try {
        const personId = await resolvePersonId(payload);
        if (!personId) {
          results.push({ id: action.id, status: 'OK', updated_at: serverTime });
          continue;
        }
        const employeeRows = await query(
          'SELECT employee_id AS server_id FROM employee WHERE person_id = ? LIMIT 1',
          [personId],
        );
        const employeeId = employeeRows[0]?.server_id ?? null;
        if (employeeId) {
          await deleteEmployeeCascade(employeeId);
        }
        await execute('DELETE FROM user_account WHERE person_id = ?', [personId]);
        await execute('DELETE FROM person WHERE person_id = ?', [personId]);
        results.push({ id: action.id, status: 'OK', updated_at: serverTime });
      } catch (error) {
        console.error(error);
        results.push({ id: action.id, status: 'ERROR', error: 'Erro no Banco de Dados' });
      }
      continue;
    }

    results.push({ id: action.id, status: 'OK' });
  }

  res.json({ results, serverTime });
};
