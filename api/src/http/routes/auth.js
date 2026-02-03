const express = require('express');
const bcrypt = require('bcryptjs');

const { query } = require('../../core/db');
const { nowIso } = require('../utils/time');

const router = express.Router();

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER ?? '';

function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

function applyPepper(password) {
  return `${password}${PASSWORD_PEPPER}`;
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash || !isBcryptHash(passwordHash)) {
    return false;
  }
  return bcrypt.compare(applyPepper(password), passwordHash);
}

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: 'invalid_credentials' });
    return;
  }

  try {
    const users = await query(
      'SELECT user_id AS user_id, person_id, username, password_hash, is_active FROM user_account WHERE username = ? LIMIT 1',
      [username],
    );

    if (!users.length) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    const user = users[0];
    if (user.is_active === 0) {
      res.status(403).json({ error: 'inactive_user' });
      return;
    }

    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    const employees = await query(
      'SELECT employee_id AS employee_id FROM employee WHERE person_id = ? LIMIT 1',
      [user.person_id],
    );

    const token = `token_${Date.now()}`;

    res.json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        user_id: user.user_id,
        person_id: user.person_id,
        employee_id: employees[0]?.employee_id ?? null,
        username: user.username,
      },
      serverTime: nowIso(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'login_failed' });
  }
});

module.exports = router;
