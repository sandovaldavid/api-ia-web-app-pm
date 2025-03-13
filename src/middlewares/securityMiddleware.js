const helmet = require('helmet');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Configure security headers using helmet
 */
exports.securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'cdn.jsdelivr.net'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    // 1 year in seconds
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    // Disable X-Powered-By header
    hidePoweredBy: true,
    // Prevent clickjacking
    frameguard: {
        action: 'deny',
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Prevent reflected XSS attacks
    xssFilter: true,
    // Prevent embedding as iframe in foreign origins
    referrerPolicy: {
        policy: 'no-referrer-when-downgrade',
    },
});

/**
 * Rate limit configuration options
 */
exports.rateLimitOptions = {
    windowMs: config.rateLimitWindowMs, // Default: 1 minute
    max: config.rateLimitMax, // Default: 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
};

/**
 * Middleware to validate origin for CORS
 */
exports.corsOptions = {
    origin: (origin, callback) => {
        // Allow all origins in development
        if (config.nodeEnv === 'development') {
            return callback(null, true);
        }

        // Allow specific origins in production
        const allowedOrigins = config.corsOrigin.split(',');

        if (allowedOrigins.includes('*')) {
            callback(null, true);
        } else if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: config.corsMethods,
    credentials: true,
    maxAge: 86400, // 24 hours
};
