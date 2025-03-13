const express = require('express');
const {
    getBasicMonitoring,
    getDetailedMonitoring,
    resetMonitoring,
    startMonitoring,
    stopMonitoring,
} = require('../controllers/monitorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All monitor routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Monitor routes
router.get('/basic', getBasicMonitoring);
router.get('/detailed', getDetailedMonitoring);
router.post('/reset', resetMonitoring);
router.post('/start', startMonitoring);
router.post('/stop', stopMonitoring);

module.exports = router;
