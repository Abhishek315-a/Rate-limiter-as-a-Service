const express = require('express');
const router = express.Router();
const rulesController = require('../controllers/rules.controller');
const { requireJWT } = require('../middleware/auth.middleware');

router.use(requireJWT);

router.get('/', rulesController.list);
router.post('/', rulesController.create);
router.put('/:ruleId', rulesController.update);
router.delete('/:ruleId', rulesController.remove);

module.exports = router;
