const express = require('express');
const { basicHealth, detailedHealth } = require('../controllers/healthController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public health check
router.get('/', basicHealth);

// Detailed health check (protected)
router.get('/detailed', protect, detailedHealth);

module.exports = router;
