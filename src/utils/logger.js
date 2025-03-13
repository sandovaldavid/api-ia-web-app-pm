const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Create logs directory if it doesn't exist
const logsDir = config.logsDir;
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define enhanced log format with metadata support
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

// File format (without colors)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
);

// Console format (with proper colorization)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        // Format the colorized level separately
        const colorLevel = winston.format.colorize().colorize(level, level.toUpperCase());
        let msg = `${timestamp} [${colorLevel}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Get log level from environment or default to 'info'
const level = () => {
    return config.logLevel || 'info';
};

// Create transports
const transports = [
    // Console transport with fixed format
    new winston.transports.Console({
        format: consoleFormat,
    }),

    // File transport for all logs
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: fileFormat,
    }),

    // File transport for error logs
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: fileFormat,
    }),

    // New HTTP log transport
    new winston.transports.File({
        filename: path.join(logsDir, 'http.log'),
        level: 'http',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: fileFormat,
    }),
];

// Create logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports,
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            format: fileFormat,
        }),
    ],
});

// HTTP Logger configuration - attach as property to logger
logger.httpLogger = {
    request: (req) => {
        logger.http('Incoming Request', {
            method: req.method,
            path: req.path,
            body: req.body,
            query: req.query,
            ip: req.ip,
        });
    },
    response: (req, res, responseTime) => {
        logger.http('Outgoing Response', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
        });
    },
};

// Debug Logger configuration - attach as property to logger
logger.debug = {
    info: (message, meta) => logger.info(message, meta),
    error: (message, meta) => logger.error(message, meta),
    warn: (message, meta) => logger.warn(message, meta),
    debug: (message, meta) => logger.debug(message, meta),
    http: (message, meta) => logger.http(message, meta),
};

// Export logger directly to maintain compatibility with existing code
module.exports = logger;
