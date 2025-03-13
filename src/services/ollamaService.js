const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { LRUCache } = require('lru-cache');

// Setup cache if enabled
const responseCache = config.enableAiResponseCache
    ? new LRUCache({
          max: 1000, // Store max 1000 items
          ttl: config.aiCacheTtl * 1000, // TTL in ms
          allowStale: false,
      })
    : null;

// Create axios instance with common config
const ollamaClient = axios.create({
    baseURL: config.ollamaApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: config.ollamaTimeout,
});

// Add request interceptor for logging
ollamaClient.interceptors.request.use(
    (config) => {
        logger.debug(`Ollama API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        logger.error(`Ollama API Request Error: ${error.message}`);
        return Promise.reject(error);
    }
);

// Add response interceptor for logging
ollamaClient.interceptors.response.use(
    (response) => {
        logger.debug(`Ollama API Response: ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            logger.error(`Ollama API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            logger.error(`Ollama API Error: No response received - ${error.message}`);
        } else {
            logger.error(`Ollama API Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);

/**
 * Generate a completion from Ollama
 * @param {string} prompt - Prompt text to send to the model
 * @param {Object} options - Additional options for the model
 * @returns {Promise<string>} Generated text
 */
exports.generateCompletion = async (prompt, options = {}) => {
    const cacheKey = prompt + JSON.stringify(options);

    // Check cache first if enabled
    if (responseCache && responseCache.has(cacheKey)) {
        logger.debug('Using cached AI response');
        return responseCache.get(cacheKey);
    }

    // Default options
    const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_tokens: 2000,
        repeat_penalty: 1.1,
    };

    // Merge default options with provided options
    const modelOptions = { ...defaultOptions, ...options };

    try {
        logger.info(`Generating AI completion for prompt: "${prompt.substring(0, 50)}..."`);

        const response = await ollamaClient.post('/generate', {
            model: config.ollamaModel,
            prompt,
            stream: false,
            options: modelOptions,
        });

        if (!response.data || !response.data.response) {
            throw new Error('Invalid response from Ollama API');
        }

        // Cache response if enabled
        if (responseCache) {
            responseCache.set(cacheKey, response.data.response);
        }

        return response.data.response;
    } catch (error) {
        logger.error(`Error generating completion: ${error.message}`);
        throw new Error(`AI model response error: ${error.message}`);
    }
};

/**
 * Generate a structured JSON response from Ollama
 * @param {string} prompt - Prompt text to send to the model
 * @param {string} expectedFormat - Description of expected format for error handling
 * @returns {Promise<Object>} Parsed JSON object
 */
exports.generateJSONCompletion = async (prompt, expectedFormat = 'JSON object') => {
    try {
        const completion = await exports.generateCompletion(prompt, {
            temperature: 0.1, // Lower temperature for more deterministic output
        });

        // Try to extract and parse JSON from the completion
        let jsonStart = completion.indexOf('{');
        let jsonEnd = completion.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error(`Response does not contain valid JSON. Expected ${expectedFormat}.`);
        }

        const jsonStr = completion.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
    } catch (error) {
        if (error.name === 'SyntaxError') {
            logger.error(`JSON parsing error: ${error.message}. Response: ${completion}`);
            throw new Error(`Failed to parse AI response as ${expectedFormat}. Invalid JSON format.`);
        }
        throw error;
    }
};

/**
 * Test connection to Ollama
 * @returns {Promise<boolean>} True if connection is successful
 */
exports.testConnection = async () => {
    try {
        const response = await ollamaClient.post('/generate', {
            model: config.ollamaModel,
            prompt: 'ping',
            stream: false,
            options: {
                temperature: 0.1,
                num_predict: 10,
            },
        });

        return response.data && response.data.response ? true : false;
    } catch (error) {
        throw new Error(`Failed to connect to Ollama: ${error.message}`);
    }
};

/**
 * Clear cache for AI responses
 * @returns {boolean} True if cache was cleared
 */
exports.clearCache = () => {
    if (responseCache) {
        responseCache.clear();
        logger.info('AI response cache cleared');
        return true;
    }
    return false;
};

/**
 * Get cache stats
 * @returns {Object|null} Cache stats or null if cache is disabled
 */
exports.getCacheStats = () => {
    if (!responseCache) return null;

    return {
        size: responseCache.size,
        itemCount: responseCache.itemCount,
        maxSize: responseCache.max,
        ttl: config.aiCacheTtl,
    };
};

/**
 * Check if a model is available in Ollama
 * @param {string} modelName - Name of the model to check
 * @returns {Promise<boolean>} True if model is available
 */
exports.checkModelAvailability = async (modelName = config.ollamaModel) => {
    try {
        const response = await axios.get(`${config.ollamaApiUrl.replace('/api', '')}/api/tags`);

        if (response.data && Array.isArray(response.data.models)) {
            return response.data.models.some((model) => model.name === modelName);
        }

        return false;
    } catch (error) {
        logger.error(`Error checking model availability: ${error.message}`);
        return false;
    }
};
