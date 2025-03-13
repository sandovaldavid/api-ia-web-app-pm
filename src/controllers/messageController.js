const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const ollamaService = require('../services/ollamaService');
const promptTemplates = require('../utils/promptTemplates');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * @desc    Create a new message in a chat
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
exports.createMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { prompt, requestType = 'user_message', taskId, projectId } = req.body;

        // Verify chat exists and belongs to user
        const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Update chat last message timestamp
        chat.lastMessage = Date.now();
        await chat.save();

        // Create user message
        const userMessage = await Message.create({
            user: req.user.id,
            chat: chatId,
            requestType,
            prompt,
            taskId,
            projectId,
        });

        // Check if response is cached
        const cacheKey = {
            prompt,
            requestType,
            taskId,
            projectId,
        };

        const cachedResponse = cacheService.get(cacheKey);

        let aiResponse;
        let aiMessage;

        if (cachedResponse) {
            logger.info(`Using cached AI response for prompt: ${prompt.substring(0, 50)}...`);
            aiResponse = cachedResponse;
        } else {
            // Generate AI response based on request type
            let finalPrompt;

            // Get chat history if not first message
            const chatHistory = await Message.find({ chat: chatId })
                .sort({ createdAt: -1 })
                .limit(10)
                .sort({ createdAt: 1 });

            // Generate appropriate prompt based on request type
            switch (requestType) {
                case 'code_suggestion':
                    finalPrompt = promptTemplates.codeSuggestionPrompt(prompt);
                    break;
                case 'task_parameterization':
                case 'project_context':
                case 'resource_assignment':
                    // These are handled by specialized controllers
                    finalPrompt = prompt;
                    break;
                case 'user_message':
                default:
                    finalPrompt = promptTemplates.generalChatPrompt(prompt, chatHistory);
                    break;
            }

            // Call Ollama service for response
            aiResponse = await ollamaService.generateCompletion(finalPrompt);

            // Cache the response if it's enabled
            cacheService.set(cacheKey, aiResponse);
        }

        // Create AI message
        aiMessage = await Message.create({
            user: req.user.id,
            chat: chatId,
            requestType: 'ai_response',
            response: {
                content: aiResponse,
                model: process.env.OLLAMA_MODEL,
            },
            taskId,
            projectId,
        });

        res.status(201).json({
            success: true,
            data: {
                userMessage,
                aiMessage,
            },
        });
    } catch (error) {
        logger.error(`Error creating message: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Get messages for a chat
 * @route   GET /api/chats/:chatId/messages
 * @access  Private
 */
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Verify chat exists and belongs to user
        const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Get messages
        const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 }).skip(skip).limit(parseInt(limit));

        // Get total messages count
        const total = await Message.countDocuments({ chat: chatId });

        res.status(200).json({
            success: true,
            count: messages.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: messages,
        });
    } catch (error) {
        logger.error(`Error getting messages: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/chats/:chatId/messages/:messageId
 * @access  Private
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;

        // Verify chat exists and belongs to user
        const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or not authorized to access',
            });
        }

        // Find message and verify it belongs to the chat
        const message = await Message.findOne({
            _id: messageId,
            chat: chatId,
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found',
            });
        }

        // Delete message
        await message.remove();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        logger.error(`Error deleting message: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message,
        });
    }
};
