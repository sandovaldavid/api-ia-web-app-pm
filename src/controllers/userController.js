const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const authService = require('../services/authService');

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/users/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn(`Intento de registro con email existente: ${email}`);
            return res.status(400).json({
                status: 'error',
                message: 'El correo ya está registrado',
            });
        }

        // Registrar usuario usando authService
        const user = await authService.registerUser({ name, email, password });

        if (user) {
            logger.info(`Nuevo usuario registrado: ${email}`);
            res.status(201).json({
                status: 'success',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    token: authService.generateToken(user._id),
                },
            });
        } else {
            logger.error('Error al crear usuario en la base de datos');
            res.status(500).json({
                status: 'error',
                message: 'Error al crear usuario',
            });
        }
    } catch (error) {
        logger.error(`Error en registro: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Error al registrar usuario',
            error: error.message,
        });
    }
};

/**
 * @desc    Autenticar usuario
 * @route   POST /api/users/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar credenciales usando authService
        const user = await authService.validateCredentials(email, password);

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas',
            });
        }

        logger.info(`Usuario autenticado: ${email}`);
        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: authService.generateToken(user._id),
            },
        });
    } catch (error) {
        logger.error(`Error en login: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Error al iniciar sesión',
            error: error.message,
        });
    }
};

/**
 * @desc    Obtener datos del usuario actual
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            logger.error(`Usuario no encontrado con ID: ${req.user.id}`);
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado',
            });
        }

        logger.info(`Solicitud de perfil para usuario: ${user.email}`);
        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        logger.error(`Error al obtener perfil: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener información del usuario',
            error: error.message,
        });
    }
};

/**
 * @desc    Actualizar perfil de usuario
 * @route   PUT /api/users/me
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.user.id;

        // Buscar el usuario
        const user = await User.findById(userId);

        if (!user) {
            logger.error(`Usuario no encontrado para actualización con ID: ${userId}`);
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado',
            });
        }

        // Actualizar campos
        const updateData = {};

        if (name) updateData.name = name;

        if (email && email !== user.email) {
            // Verificar si el email ya está en uso
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                logger.warn(`Intento de actualizar a un email existente: ${email}`);
                return res.status(400).json({
                    status: 'error',
                    message: 'El correo ya está registrado',
                });
            }
            updateData.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

        logger.info(`Perfil actualizado para usuario: ${updatedUser.email}`);
        res.status(200).json({
            status: 'success',
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
            },
        });
    } catch (error) {
        logger.error(`Error al actualizar perfil: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el perfil',
            error: error.message,
        });
    }
};
