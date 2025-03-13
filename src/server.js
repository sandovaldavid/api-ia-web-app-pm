const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { monitor } = require('./utils/monitoring');
const { runChecks } = require('../tools/check-config');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message, err.stack);
    process.exit(1);
});

// Check configuration before starting
runChecks().then(async (configOk) => {
    if (!configOk && config.nodeEnv === 'production') {
        logger.error('Configuration check failed. Exiting in production mode.');
        process.exit(1);
    }

    // Connect to MongoDB
    await connectDB();

    // Start the server
    const server = app.listen(config.port, () => {
        logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });

    // Start monitoring
    if (config.enableMonitoring) {
        monitor.start();

        // Listen for monitoring warnings
        monitor.on('memoryWarning', (usage) => {
            logger.warn(`High memory usage: ${usage.toFixed(2)}%`);
        });

        monitor.on('cpuWarning', (usage) => {
            logger.warn(`High CPU usage: ${usage.toFixed(2)}%`);
        });
    }

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
        logger.error(err.name, err.message, err.stack);

        server.close(() => {
            process.exit(1);
        });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
        logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
        server.close(() => {
            mongoose.connection.close();
            logger.info('💥 Process terminated!');
        });
    });
});
