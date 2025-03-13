const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Middleware para proteger rutas - Verifica si el usuario está autenticado
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Verificar si existe el token en los headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Verificar si el token existe
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado para acceder a esta ruta',
            });
        }

        try {
            // Verificar el token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Agregar el usuario al request
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no encontrado',
                });
            }

            next();
        } catch (error) {
            logger.error(`Error en autenticación: ${error.message}`);
            return res.status(401).json({
                success: false,
                error: 'No autorizado para acceder a esta ruta',
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware para acceso según roles
 * @param  {...String} roles - Roles autorizados
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`,
            });
        }

        next();
    };
};
