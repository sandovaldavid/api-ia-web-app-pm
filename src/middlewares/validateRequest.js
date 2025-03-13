const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware que verifica si hay errores de validación
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            })),
        });
    }
    next();
};

/**
 * Validaciones para autenticación
 */
const authValidations = {
    login: [
        body('email')
            .notEmpty()
            .withMessage('El email es requerido')
            .isEmail()
            .withMessage('Debe proporcionar un email válido'),
        body('password')
            .notEmpty()
            .withMessage('La contraseña es requerida')
            .isLength({ min: 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres'),
    ],
    register: [
        body('name')
            .notEmpty()
            .withMessage('El nombre es requerido')
            .isLength({ min: 2 })
            .withMessage('El nombre debe tener al menos 2 caracteres'),
        body('email')
            .notEmpty()
            .withMessage('El email es requerido')
            .isEmail()
            .withMessage('Debe proporcionar un email válido'),
        body('password')
            .notEmpty()
            .withMessage('La contraseña es requerida')
            .isLength({ min: 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres'),
    ],
};

/**
 * Validaciones para tareas
 */
const taskValidations = {
    parameterize: [param('taskId').notEmpty().withMessage('El ID de la tarea es requerido')],
};

/**
 * Validaciones para recursos
 */
const resourceValidations = {
    assign: [param('taskId').notEmpty().withMessage('El ID de la tarea es requerido')],
};

/**
 * Validaciones para chats
 */
const chatValidations = {
    create: [
        body('title')
            .notEmpty()
            .withMessage('El título es requerido')
            .isLength({ max: 100 })
            .withMessage('El título no puede tener más de 100 caracteres'),
    ],
    update: [
        param('id').notEmpty().withMessage('El ID del chat es requerido'),
        body('title').optional().isLength({ max: 100 }).withMessage('El título no puede tener más de 100 caracteres'),
    ],
};

/**
 * Validaciones para mensajes
 */
const messageValidations = {
    create: [
        param('chatId').notEmpty().withMessage('El ID del chat es requerido'),
        body('prompt').notEmpty().withMessage('El contenido del mensaje es requerido'),
    ],
    update: [param('id').notEmpty().withMessage('El ID del mensaje es requerido')],
};

module.exports = {
    validateRequest,
    authValidations,
    taskValidations,
    resourceValidations,
    chatValidations,
    messageValidations,
};
