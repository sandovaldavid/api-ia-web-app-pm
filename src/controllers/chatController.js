const Chat = require('../models/Chat');
const Message = require('../models/Message');
const logger = require('../utils/logger');

/**
 * @desc    Create a new chat
 * @route   POST /api/chats
 * @access  Private
 */
exports.createChat = async (req, res) => {
    try {
        const { title, projectId, taskId } = req.body;

        const chat = await Chat.create({
            title,
            user: req.user.id,
            projectId,
            taskId,
            status: 'active',
        });

        res.status(201).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        logger.error(`Error creating chat: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Get all chats for a user
 * @route   GET /api/chats
 * @access  Private
 */
exports.getChats = async (req, res) => {
    try {
        const { status, projectId, taskId, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = { user: req.user.id };

        // Add optional filters
        if (status) query.status = status;
        if (projectId) query.projectId = projectId;
        if (taskId) query.taskId = taskId;

        // Execute query with pagination
        const chats = await Chat.find(query).sort({ lastMessage: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit));

        // Get total count
        const total = await Chat.countDocuments(query);

        res.status(200).json({
            success: true,
            count: chats.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: chats,
        });
    } catch (error) {
        logger.error(`Error getting chats: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Get a single chat by ID
 * @route   GET /api/chats/:id
 * @access  Private
 */
exports.getChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        res.status(200).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        logger.error(`Error getting chat: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Update a chat
 * @route   PUT /api/chats/:id
 * @access  Private
 */
exports.updateChat = async (req, res) => {
    try {
        let chat = await Chat.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Only allow updating title and status
        const { title, status } = req.body;
        const updates = {};
        if (title) updates.title = title;
        if (status) updates.status = status;

        // Update chat
        chat = await Chat.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        logger.error(`Error updating chat: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Archive a chat
 * @route   PATCH /api/chats/:id/archive
 * @access  Private
 */
exports.archiveChat = async (req, res) => {
    try {
        let chat = await Chat.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Update status to archived
        chat = await Chat.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });

        res.status(200).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        logger.error(`Error archiving chat: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Delete a chat
 * @route   DELETE /api/chats/:id
 * @access  Private
 */
exports.deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Delete all messages in the chat
        await Message.deleteMany({ chat: req.params.id });

        // Delete chat
        await chat.remove();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        logger.error(`Error deleting chat: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};
