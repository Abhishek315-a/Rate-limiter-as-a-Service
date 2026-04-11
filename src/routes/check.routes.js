const express = require('express');
const router = express.Router();
const checkController = require('../controllers/check.controller');
const { requireApiKey } = require('../middleware/auth.middleware');

router.post('/', requireApiKey, checkController.check);

module.exports = router;
