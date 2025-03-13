const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Servicio para manejar la autenticación y generación de tokens
 */
class AuthService {
    /**
     * Genera un JWT para el ID de usuario proporcionado
     * @param {string} id - ID del usuario
     * @returns {string} Token JWT
     */
    generateToken(id) {
        return jwt.sign({ id }, config.jwtSecret, {
            expiresIn: config.jwtExpire,
        });
    }

    /**
     * Verifica si las credenciales son válidas
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object|null>} Usuario si las credenciales son válidas, null si no
     */
    async validateCredentials(email, password) {
        try {
            // Buscar usuario
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                logger.warn(`Intento de login con email no registrado: ${email}`);
                return null;
            }

            // Verificar contraseña
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                logger.warn(`Intento de login fallido para: ${email}`);
                return null;
            }

            return user;
        } catch (error) {
            logger.error(`Error validando credenciales: ${error.message}`);
            throw error;
        }
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario a registrar
     * @returns {Promise<Object>} Usuario creado
     */
    async registerUser(userData) {
        try {
            const { name, email, password } = userData;

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear usuario
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
            });

            return user;
        } catch (error) {
            logger.error(`Error registrando usuario: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new AuthService();
