const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Environment variables with defaults
module.exports = {
    // Node/Express config
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/api-intermediaria',

    // JWT Authentication
    jwtSecret: process.env.JWT_SECRET || 'development_jwt_secret',
    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // Django API (external project management system)
    djangoApiUrl: process.env.DJANGO_API_URL || 'http://localhost:8000/api',
    djangoApiToken: process.env.DJANGO_API_TOKEN || '',

    // Ollama AI API
    ollamaApiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434/api',
    ollamaModel: process.env.OLLAMA_MODEL || 'deepseek-coder',
    ollamaTimeout: parseInt(process.env.OLLAMA_TIMEOUT, 10) || 60000, // 60 seconds

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'combined',

    // Monitoring
    enableMonitoring: process.env.ENABLE_MONITORING === 'true',
    monitoringInterval: parseInt(process.env.MONITORING_INTERVAL, 10) || 60000, // 60 seconds
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD, 10) || 85, // percentage
    cpuThreshold: parseInt(process.env.CPU_THRESHOLD, 10) || 80, // percentage

    // Cache
    enableAiResponseCache: process.env.ENABLE_AI_RESPONSE_CACHE === 'true',
    aiCacheTtl: parseInt(process.env.AI_CACHE_TTL, 10) || 86400, // 24 hours

    // Rate limiting
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // requests per window

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',
    corsMethods: process.env.CORS_METHODS || 'GET,POST,PATCH,DELETE',

    // Security
    securityHelmetEnabled: process.env.SECURITY_HELMET_ENABLED !== 'false',

    // Paths
    rootDir: path.resolve(__dirname, '../..'),
    logsDir: path.resolve(__dirname, '../../logs'),
    uploadsDir: path.resolve(__dirname, '../../uploads'),
};
