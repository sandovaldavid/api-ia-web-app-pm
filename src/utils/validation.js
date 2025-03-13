/**
 * @desc    Validation utilities for API requests
 * @author  David Sandoval
 */

const Joi = require('joi');
const logger = require('./logger');

/**
 * Validate request data against a schema
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
exports.validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            // Transform Joi errors into a readable format
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            logger.debug(`Validation error: ${error.message}`);

            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: errors,
            });
        }

        // Replace request data with validated data
        req[property] = value;
        next();
    };
};

/**
 * Common validation schemas
 */
exports.schemas = {
    // User related schemas
    user: {
        register: Joi.object({
            name: Joi.string().min(3).max(50).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('user', 'admin').default('user'),
        }),
        login: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }),
        update: Joi.object({
            name: Joi.string().min(3).max(50),
            email: Joi.string().email(),
            password: Joi.string().min(6),
            currentPassword: Joi.string().min(6).when('password', {
                is: Joi.exist(),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
        }),
    },

    // Chat related schemas
    chat: {
        create: Joi.object({
            title: Joi.string().min(3).max(100).required(),
            projectId: Joi.string().optional(),
            taskId: Joi.string().optional(),
        }),
        update: Joi.object({
            title: Joi.string().min(3).max(100).optional(),
            status: Joi.string().valid('active', 'archived').optional(),
        }),
        list: Joi.object({
            status: Joi.string().valid('active', 'archived'),
            projectId: Joi.string(),
            taskId: Joi.string(),
            limit: Joi.number().integer().min(1).max(100).default(10),
            page: Joi.number().integer().min(1).default(1),
        }),
    },

    // Message related schemas
    message: {
        create: Joi.object({
            prompt: Joi.string().min(1).required(),
            requestType: Joi.string()
                .valid('user_message', 'code_suggestion', 'task_parameterization', 'project_context')
                .default('user_message'),
            projectId: Joi.string().optional(),
            taskId: Joi.string().optional(),
        }),
        list: Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50),
            page: Joi.number().integer().min(1).default(1),
        }),
    },

    // Task related schemas
    task: {
        parameterize: Joi.object({
            taskId: Joi.string().required(),
        }),
        resource: Joi.object({
            taskId: Joi.string().required(),
        }),
        project: Joi.object({
            projectId: Joi.string().required(),
        }),
    },
};
