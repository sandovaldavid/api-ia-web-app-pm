const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const monitorController = require('../controllers/monitorController');

const router = express.Router();

// Apply auth middleware and admin-only restriction to all routes
router.use(protect);
router.use(authorize('admin'));

// Monitoring routes
router.get('/basic', monitorController.getBasicMonitoring);
router.get('/detailed', monitorController.getDetailedMonitoring);
router.post('/reset', monitorController.resetMonitoring);
router.post('/start', monitorController.startMonitoring);
router.post('/stop', monitorController.stopMonitoring);

module.exports = router;
