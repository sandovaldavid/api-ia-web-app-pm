const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, chatValidations } = require('../middlewares/validateRequest');
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Chat routes
router.route('/').post(chatValidations.create, validateRequest, chatController.createChat).get(chatController.getChats);

router
    .route('/:id')
    .get(chatController.getChat)
    .put(chatValidations.update, validateRequest, chatController.updateChat)
    .delete(chatController.deleteChat);

router.patch('/:id/archive', chatController.archiveChat);

// Messages within chats
router
    .route('/:chatId/messages')
    .get(messageController.getMessages)
    .post(validateRequest, messageController.createMessage);

router.route('/:chatId/messages/:messageId').delete(messageController.deleteMessage);

module.exports = router;
