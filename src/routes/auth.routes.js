const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireJWT } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/keys', requireJWT, authController.createApiKey);
router.get('/keys', requireJWT, authController.listApiKeys);
router.delete('/keys/:keyId', requireJWT, authController.revokeApiKey);

module.exports = router;
