const mongoose = require('mongoose');
const logger = require('../utils/logger');
const ollamaService = require('../services/ollamaService');
const djangoService = require('../services/djangoService');
const { version } = require('../../package.json');

/**
 * @desc    Basic health check
 * @route   GET /health
 * @access  Public
 */
exports.basicHealth = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Intermediaria is running',
        version,
        time: new Date().toISOString(),
    });
};

/**
 * @desc    Detailed health check for all services
 * @route   GET /health/detailed
 * @access  Private
 */
exports.detailedHealth = async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Check Ollama service
        let ollamaStatus = 'unknown';
        try {
            await ollamaService.testConnection();
            ollamaStatus = 'connected';
        } catch (error) {
            logger.error(`Ollama health check failed: ${error.message}`);
            ollamaStatus = 'error';
        }

        // Check Django service
        let djangoStatus = 'unknown';
        try {
            await djangoService.testConnection();
            djangoStatus = 'connected';
        } catch (error) {
            logger.error(`Django health check failed: ${error.message}`);
            djangoStatus = 'error';
        }

        // System information
        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };

        res.status(200).json({
            success: true,
            version,
            time: new Date().toISOString(),
            services: {
                api: 'running',
                mongodb: mongoStatus,
                ollama: ollamaStatus,
                django: djangoStatus,
            },
            system: systemInfo,
        });
    } catch (error) {
        logger.error(`Detailed health check failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message,
        });
    }
};
