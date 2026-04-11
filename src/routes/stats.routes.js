const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { requireJWT } = require('../middleware/auth.middleware');

router.use(requireJWT);

router.get('/', statsController.getSummary);
router.get('/timeseries', statsController.getTimeSeries);
router.get('/:identifier', statsController.getByIdentifier);

module.exports = router;
