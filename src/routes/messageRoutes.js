const express = require('express');
const { createMessage, getMessages, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../utils/validation');

const router = express.Router({ mergeParams: true });

// All message routes are protected
router.use(protect);

// Message routes
router
    .route('/')
    .get(validate(schemas.message.list, 'query'), getMessages)
    .post(validate(schemas.message.create), createMessage);

router.route('/:messageId').delete(deleteMessage);

module.exports = router;
