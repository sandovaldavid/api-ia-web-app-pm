const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { securityHeaders, corsOptions, rateLimitOptions } = require('./middlewares/securityMiddleware');
const { trackRequest, addMonitoringHeaders } = require('./middlewares/monitoringMiddleware');
const { cacheDebugMiddleware } = require('./services/cacheService');
const { setupSwagger } = require('./config/swagger');
const { errorHandler } = require('./middlewares/errorHandler');
const config = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Track request start time for monitoring
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Security headers via helmet
app.use(securityHeaders);

// Enable CORS with custom options
app.use(cors(corsOptions));

// Request rate limiter
if (config.enableRateLimit) {
    app.use(rateLimit(rateLimitOptions));
}

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compress all responses
app.use(compression());

// Monitoring middleware
app.use(trackRequest);
app.use(addMonitoringHeaders);
app.use(cacheDebugMiddleware);

// Request logging
if (config.nodeEnv !== 'test') {
    app.use(
        morgan(config.logFormat, {
            stream: { write: (message) => logger.http(message.trim()) },
        })
    );
}

// Setup Swagger documentation
setupSwagger(app);

// Serve static documentation files
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Mount API routes
app.use('/api', routes);

// Serve 404 for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
    });
});

// Redirect root to documentation
app.get('/', (req, res) => {
    res.redirect('/docs');
});

// Serve 404.html for non-API, non-documentation routes
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../docs/404.html'));
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
