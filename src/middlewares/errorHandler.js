/**
 * @desc    Global error handling middleware
 * @author  David Sandoval
 */

const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Clase de error personalizada
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware para manejar errores
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    logger.error(`${err.name || 'Error'}: ${err.message}`, {
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        error.message = 'Duplicate field value entered';
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token. Please log in again';
        error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Your token has expired. Please log in again';
        error.statusCode = 401;
    }

    // Send error response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
};

module.exports = {
    AppError,
    errorHandler,
};
