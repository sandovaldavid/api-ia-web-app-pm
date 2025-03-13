const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Configure mongoose options
const options = {
    autoIndex: config.nodeEnv === 'development',
    connectTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 60000, // 60 seconds
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri, options);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Add event listeners for connection
        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return conn;
    } catch (err) {
        logger.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
