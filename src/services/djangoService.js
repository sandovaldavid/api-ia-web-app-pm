const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

class DjangoService {
    constructor() {
        this.apiClient = axios.create({
            baseURL: config.djangoApiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${config.djangoApiToken}`,
            },
            params: {
                format: 'json',
            },
        });
    }

    /**
     * Get a task by ID from the Django API
     * @param {string} taskId - ID of the task to retrieve
     * @returns {Promise<Object>} - Task data
     */
    async getTaskById(taskId) {
        try {
            logger.info(`Fetching task ${taskId} from Django API`);
            logger.info(`URL: ${this.apiClient.getUri()}`);
            logger.info(`Headers: ${JSON.stringify(this.apiClient.defaults.headers)}`);
            logger.info(`Authorization: ${config.djangoApiToken}`);
            const response = await this.apiClient.get(`/tareas/${taskId}`);
            logger.info(`Task ${taskId} fetched successfully`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new task in the Django API
     * @param {Object} taskData - Task data to create
     * @returns {Promise<Object>} - Created task
     */
    async createTask(taskData) {
        try {
            logger.info(`Creating new task in Django API`);
            const response = await this.apiClient.post('/api/tasks/', taskData);
            return response.data;
        } catch (error) {
            logger.error(`Error creating task: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a task in the Django API
     * @param {string} taskId - ID of the task to update
     * @param {Object} taskData - Updated task data
     * @returns {Promise<Object>} - Updated task
     */
    async updateTask(taskId, taskData) {
        try {
            logger.info(`Updating task ${taskId} in Django API`);
            const response = await this.apiClient.put(`/api/tasks/${taskId}/`, taskData);
            return response.data;
        } catch (error) {
            logger.error(`Error updating task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get tasks for a specific project
     * @param {string} projectId - ID of the project
     * @returns {Promise<Array>} - Array of tasks
     */
    async getTasksByProject(projectId) {
        try {
            logger.info(`Fetching tasks for project ${projectId}`);
            const response = await this.apiClient.get(`/api/projects/${projectId}/tasks/`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching tasks for project ${projectId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DjangoService();
