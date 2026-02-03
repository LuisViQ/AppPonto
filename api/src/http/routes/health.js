const express = require('express');

const { nowIso } = require('../utils/time');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', serverTime: nowIso() });
});

module.exports = router;
