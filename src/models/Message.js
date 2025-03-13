const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    requestType: {
        type: String,
        enum: [
            'user_message',
            'ai_response',
            'code_suggestion',
            'task_parameterization',
            'project_context',
            'resource_assignment',
        ],
        required: true,
    },
    prompt: {
        type: String,
        trim: true,
        default: null,
    },
    response: {
        content: {
            type: String,
            trim: true,
            default: null,
        },
        model: {
            type: String,
            default: null,
        },
        time: {
            type: Number,
            default: null,
        },
    },
    taskId: {
        type: String,
        default: null,
    },
    projectId: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add index for faster querying
MessageSchema.index({ chat: 1, createdAt: 1 });
MessageSchema.index({ user: 1 });
MessageSchema.index({ requestType: 1 });
MessageSchema.index({ taskId: 1 });
MessageSchema.index({ projectId: 1 });

module.exports = mongoose.model('Message', MessageSchema);
