const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Basic health check is public
router.get('/', healthController.basicHealth);

// Detailed health check requires authentication and admin rights
router.get('/detailed', protect, authorize('admin'), healthController.detailedHealth);

module.exports = router;
