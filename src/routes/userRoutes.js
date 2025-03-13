const express = require('express');
const { register, login, getMe, updateProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.user.register), register);
router.post('/login', validate(schemas.user.login), login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, validate(schemas.user.update), updateProfile);

module.exports = router;
