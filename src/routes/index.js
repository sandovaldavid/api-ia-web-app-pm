const express = require('express');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const taskRoutes = require('./taskRoutes');
const resourceRoutes = require('./resourceRoutes');
const healthRoutes = require('./healthRoutes');
const monitorRoutes = require('./monitorRoutes');

const router = express.Router();

// Register all routes
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/tasks', taskRoutes);
router.use('/resources', resourceRoutes);
router.use('/health', healthRoutes);
router.use('/monitor', monitorRoutes);
router.use('/messages', messageRoutes);

// Default route
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Intermediaria - Welcome to the API',
        version: require('../../package.json').version,
    });
});

module.exports = router;
