const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Registrar usuario
 * @route   POST /api/users/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });

        if (user) {
            return next(new AppError('El usuario ya existe', 400));
        }

        // Crear usuario
        user = await User.create({
            name,
            email,
            password,
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Iniciar sesión
 * @route   POST /api/users/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Verificar si se proporcionó email y contraseña
        if (!email || !password) {
            return next(new AppError('Por favor proporcione email y contraseña', 400));
        }

        // Verificar si el usuario existe
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new AppError('Credenciales inválidas', 401));
        }

        // Verificar si la contraseña coincide
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return next(new AppError('Credenciales inválidas', 401));
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Enviar respuesta con token
 */
const sendTokenResponse = (user, statusCode, res) => {
    // Crear token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};
