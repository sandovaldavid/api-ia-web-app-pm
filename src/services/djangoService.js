const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

// Create axios instance with common config
const djangoClient = axios.create({
    baseURL: config.djangoApiUrl,
    headers: {
        Authorization: `Token ${config.djangoApiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Add request interceptor for logging
djangoClient.interceptors.request.use(
    (config) => {
        logger.debug(`Django API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        logger.error(`Django API Request Error: ${error.message}`);
        return Promise.reject(error);
    }
);

// Add response interceptor for logging
djangoClient.interceptors.response.use(
    (response) => {
        logger.debug(`Django API Response: ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            logger.error(`Django API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            logger.error(`Django API Error: No response received - ${error.message}`);
        } else {
            logger.error(`Django API Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);

/**
 * Get a specific task by ID
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Task data
 */
exports.getTaskById = async (taskId) => {
    try {
        const response = await djangoClient.get(`/tasks/${taskId}/`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching task ${taskId}: ${error.message}`);
    }
};

/**
 * Get a specific project by ID
 * @param {string} projectId - ID of the project
 * @returns {Promise<Object>} Project data
 */
exports.getProjectById = async (projectId) => {
    try {
        const response = await djangoClient.get(`/projects/${projectId}/`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching project ${projectId}: ${error.message}`);
    }
};

/**
 * Get all tasks for a project
 * @param {string} projectId - ID of the project
 * @returns {Promise<Array>} List of tasks
 */
exports.getTasksByProject = async (projectId) => {
    try {
        const response = await djangoClient.get(`/projects/${projectId}/tasks/`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching tasks for project ${projectId}: ${error.message}`);
    }
};

/**
 * Get all available resources (team members)
 * @returns {Promise<Array>} List of resources
 */
exports.getResources = async () => {
    try {
        const response = await djangoClient.get('/resources/');
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching resources: ${error.message}`);
    }
};

/**
 * Get resources by project
 * @param {string} projectId - ID of the project
 * @returns {Promise<Array>} List of resources assigned to the project
 */
exports.getResourcesByProject = async (projectId) => {
    try {
        const response = await djangoClient.get(`/projects/${projectId}/resources/`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching resources for project ${projectId}: ${error.message}`);
    }
};

/**
 * Update task in Django
 * @param {string} taskId - ID of the task
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task
 */
exports.updateTask = async (taskId, updates) => {
    try {
        const response = await djangoClient.patch(`/tasks/${taskId}/`, updates);
        return response.data;
    } catch (error) {
        throw new Error(`Error updating task ${taskId}: ${error.message}`);
    }
};

/**
 * Test connection to Django API
 * @returns {Promise<boolean>} True if connection is successful
 */
exports.testConnection = async () => {
    try {
        const response = await djangoClient.get('/health/');
        return response.status === 200;
    } catch (error) {
        throw new Error(`Failed to connect to Django API: ${error.message}`);
    }
};
