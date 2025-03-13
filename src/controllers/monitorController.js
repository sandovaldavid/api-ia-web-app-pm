const os = require('os');
const mongoose = require('mongoose');
const { monitor } = require('../utils/monitoring');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');
const { version } = require('../../package.json');
const ollamaService = require('../services/ollamaService');
const djangoService = require('../services/djangoService');

/**
 * @desc    Get basic monitoring data
 * @route   GET /api/monitor/basic
 * @access  Private (Admin)
 */
exports.getBasicMonitoring = async (req, res) => {
    try {
        // Get system metrics
        const metrics = monitor.getMetrics();

        // Get database stats
        const dbStats = {
            users: await User.countDocuments(),
            chats: await Chat.countDocuments(),
            messages: await Message.countDocuments(),
            aiMessages: await Message.countDocuments({ requestType: 'ai_response' }),
            userMessages: await Message.countDocuments({ requestType: 'user_message' }),
        };

        // Get MongoDB connection status
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Basic service status
        const services = {
            api: 'running',
            mongodb: mongoStatus,
            // More detailed status checks are done in detailedMonitoring
        };

        res.status(200).json({
            success: true,
            version,
            uptime: metrics.uptime,
            system: {
                cpu: metrics.cpuUsage.toFixed(1),
                memory: metrics.memoryUsage.toFixed(1),
                platform: metrics.platform,
                arch: metrics.arch,
                nodejs: metrics.nodeVersion,
            },
            services,
            stats: dbStats,
            requests: {
                total: metrics.requestCount,
                errors: metrics.errorCount,
                avgResponseTime: metrics.avgResponseTime.toFixed(1),
            },
        });
    } catch (error) {
        logger.error(`Error fetching monitoring data: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error fetching monitoring data',
            message: error.message,
        });
    }
};

/**
 * @desc    Get detailed monitoring data
 * @route   GET /api/monitor/detailed
 * @access  Private (Admin)
 */
exports.getDetailedMonitoring = async (req, res) => {
    try {
        // Get system metrics
        const metrics = monitor.getMetrics();

        // Get detailed system information
        const systemInfo = {
            cpus: os.cpus(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            usedMemory: os.totalmem() - os.freemem(),
            loadAverage: os.loadavg(),
            networkInterfaces: os.networkInterfaces(),
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname(),
            arch: os.arch(),
            uptime: os.uptime(),
            processUptime: process.uptime(),
            nodeVersion: process.version,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Get MongoDB status
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Test services connections
        let ollamaStatus = 'unknown';
        let djangoStatus = 'unknown';

        try {
            const ollamaTest = await ollamaService.testConnection();
            ollamaStatus = ollamaTest ? 'connected' : 'error';
        } catch (error) {
            ollamaStatus = 'error';
            logger.error(`Ollama connection test failed: ${error.message}`);
        }

        try {
            const djangoTest = await djangoService.testConnection();
            djangoStatus = djangoTest ? 'connected' : 'error';
        } catch (error) {
            djangoStatus = 'error';
            logger.error(`Django connection test failed: ${error.message}`);
        }

        // Get database statistics
        const dbStats = {
            users: {
                count: await User.countDocuments(),
                recent: await User.countDocuments({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            },
            chats: {
                count: await Chat.countDocuments(),
                active: await Chat.countDocuments({ status: 'active' }),
                archived: await Chat.countDocuments({ status: 'archived' }),
                recent: await Chat.countDocuments({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            },
            messages: {
                count: await Message.countDocuments(),
                ai: await Message.countDocuments({ requestType: 'ai_response' }),
                user: await Message.countDocuments({ requestType: 'user_message' }),
                recent: await Message.countDocuments({
                    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                }),
            },
        };

        // Get hourly message stats for the last 24 hours
        const hourlyStats = await Message.aggregate([
            {
                $match: {
                    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' },
                        type: '$requestType',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        ]);

        // Get Ollama cache stats
        const cacheStats = ollamaService.getCacheStats();

        res.status(200).json({
            success: true,
            version,
            timestamp: new Date(),
            system: systemInfo,
            metrics: {
                cpu: metrics.cpuUsage.toFixed(1),
                memory: metrics.memoryUsage.toFixed(1),
                requestCount: metrics.requestCount,
                errorCount: metrics.errorCount,
                avgResponseTime: metrics.avgResponseTime.toFixed(1),
                uptime: metrics.uptime,
            },
            services: {
                api: 'running',
                mongodb: mongoStatus,
                ollama: ollamaStatus,
                django: djangoStatus,
            },
            database: dbStats,
            hourlyStats,
            cache: cacheStats,
        });
    } catch (error) {
        logger.error(`Error fetching detailed monitoring: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error fetching detailed monitoring data',
            message: error.message,
        });
    }
};

/**
 * @desc    Reset monitoring counters
 * @route   POST /api/monitor/reset
 * @access  Private (Admin)
 */
exports.resetMonitoring = (req, res) => {
    try {
        monitor.resetCounters();

        res.status(200).json({
            success: true,
            message: 'Monitoring counters reset successfully',
        });
    } catch (error) {
        logger.error(`Error resetting monitoring: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error resetting monitoring counters',
            message: error.message,
        });
    }
};

/**
 * @desc    Start monitoring if not already started
 * @route   POST /api/monitor/start
 * @access  Private (Admin)
 */
exports.startMonitoring = (req, res) => {
    try {
        if (monitor.isRunning) {
            return res.status(400).json({
                success: false,
                error: 'Monitoring is already running',
            });
        }

        monitor.start();

        res.status(200).json({
            success: true,
            message: 'Monitoring started successfully',
        });
    } catch (error) {
        logger.error(`Error starting monitoring: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error starting monitoring',
            message: error.message,
        });
    }
};

/**
 * @desc    Stop monitoring
 * @route   POST /api/monitor/stop
 * @access  Private (Admin)
 */
exports.stopMonitoring = (req, res) => {
    try {
        if (!monitor.isRunning) {
            return res.status(400).json({
                success: false,
                error: 'Monitoring is not running',
            });
        }

        monitor.stop();

        res.status(200).json({
            success: true,
            message: 'Monitoring stopped successfully',
        });
    } catch (error) {
        logger.error(`Error stopping monitoring: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error stopping monitoring',
            message: error.message,
        });
    }
};
