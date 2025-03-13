const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Create logs directory if it doesn't exist
const logsDir = config.logsDir;
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => {
        return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
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
    // Console transport for all environments
    new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), logFormat),
    }),

    // File transport for all logs
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }),

    // File transport for error logs
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }),
];

// Create logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format: logFormat,
    transports,
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
});

// Export logger
module.exports = logger;
