const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, messageValidations } = require('../middlewares/validateRequest');
const messageController = require('../controllers/messageController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Message routes (these are additional to the nested routes in chatRoutes)
router.post('/:chatId', messageValidations.create, validateRequest, messageController.createMessage);
router.delete('/:id', validateRequest, messageController.deleteMessage);

module.exports = router;
