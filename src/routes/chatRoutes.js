const express = require('express');
const { createChat, getChats, getChat, updateChat, archiveChat, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All chat routes are protected
router.use(protect);

// Chat routes
router.route('/').get(validate(schemas.chat.list, 'query'), getChats).post(validate(schemas.chat.create), createChat);

router.route('/:id').get(getChat).put(validate(schemas.chat.update), updateChat).delete(deleteChat);

router.patch('/:id/archive', archiveChat);

module.exports = router;
