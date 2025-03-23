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
            const response = await this.apiClient.get(`/tareas/${taskId}`);
            
            // Log the complete task data to diagnose what's available
            logger.info(`Task ${taskId} fetched successfully`);
            logger.debug.info(`Raw task data from Django: ${JSON.stringify(response.data)}`);
            
            if (!response.data || Object.keys(response.data).length === 0) {
                logger.warn(`Task ${taskId} data is empty or malformed`);
                return null;
            }
            
            // Map Django task fields to expected format in our application
            const task = {
                id: response.data.idtarea,
                title: response.data.nombretarea,
                description: response.data.descripcion,
                status: response.data.estado,
                statusDisplay: response.data.estado_display,
                priority: response.data.prioridad,
                priorityDisplay: response.data.prioridad_display,
                type: response.data.tipo_tarea,
                typeDisplay: response.data.tipo_tarea_nombre,
                startDate: response.data.fechainicio,
                endDate: response.data.fechafin,
                estimatedDuration: response.data.duracionestimada,
                actualDuration: response.data.duracionactual,
                difficulty: response.data.dificultad,
                phase: response.data.fase,
                phaseDisplay: response.data.fase_nombre,
                clarityOfRequirements: response.data.claridad_requisitos,
                estimatedSize: response.data.tamaño_estimado,
                estimatedCost: response.data.costoestimado,
                actualCost: response.data.costoactual,
                requirementId: response.data.idrequerimiento,
                requirementDescription: response.data.requerimiento_descripcion,
                createdAt: response.data.fechacreacion,
                updatedAt: response.data.fechamodificacion,
                tags: response.data.tags ? response.data.tags.split(',').map(tag => tag.trim()) : [],
                project: {
                    name: response.data.proyecto_nombre
                }
            };
            
            logger.debug.info(`Mapped task data: ${JSON.stringify(task)}`);
            return task;
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
            const response = await this.apiClient.post('/tareas/', taskData);
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
            const response = await this.apiClient.put(`/tareas/${taskId}/`, taskData);
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
            const response = await this.apiClient.get(`/proyectos/${projectId}/tareas/`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching tasks for project ${projectId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DjangoService();
