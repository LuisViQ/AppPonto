const express = require('express');

const syncPull = require('./sync/pull');
const syncPush = require('./sync/push');

const router = express.Router();

router.post('/sync/push', syncPush);
router.get('/sync/pull', syncPull);

module.exports = router;
