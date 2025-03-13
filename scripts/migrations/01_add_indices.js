/**
 * Migration: Add indices to collections
 *
 * This script adds required indices to MongoDB collections for better performance.
 * Run this script when deploying to a new environment or after schema changes.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../src/models/User');
const Chat = require('../../src/models/Chat');
const Message = require('../../src/models/Message');

// Load environment variables
dotenv.config();

async function runMigration() {
    console.log('Starting database migration: Adding indices');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create indices
        console.log('Creating indices...');

        // User indices
        await User.collection.createIndex({ email: 1 }, { unique: true });
        console.log('- Added unique index on User.email');

        // Chat indices
        await Chat.collection.createIndex({ user: 1, createdAt: -1 });
        console.log('- Added index on Chat.user and Chat.createdAt');
        await Chat.collection.createIndex({ taskId: 1 });
        console.log('- Added index on Chat.taskId');
        await Chat.collection.createIndex({ projectId: 1 });
        console.log('- Added index on Chat.projectId');
        await Chat.collection.createIndex({ status: 1 });
        console.log('- Added index on Chat.status');

        // Message indices
        await Message.collection.createIndex({ chat: 1, createdAt: 1 });
        console.log('- Added index on Message.chat and Message.createdAt');
        await Message.collection.createIndex({ user: 1 });
        console.log('- Added index on Message.user');
        await Message.collection.createIndex({ taskId: 1 });
        console.log('- Added index on Message.taskId');
        await Message.collection.createIndex({ projectId: 1 });
        console.log('- Added index on Message.projectId');

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration
runMigration();
