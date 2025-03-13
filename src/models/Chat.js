const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    taskId: {
        type: String,
        default: null,
    },
    projectId: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active',
    },
    lastMessage: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field before save
ChatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add index for faster querying by user
ChatSchema.index({ user: 1, updatedAt: -1 });
ChatSchema.index({ user: 1, status: 1 });
ChatSchema.index({ taskId: 1 });
ChatSchema.index({ projectId: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
