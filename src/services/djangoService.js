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
                tags: response.data.tags ? response.data.tags.split(',').map((tag) => tag.trim()) : [],
                project: {
                    name: response.data.proyecto_nombre,
                },
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

    /**
     * Get all available resources from the Django API
     * @param {Object} filters - Optional filters to apply (tipo, disponibilidad)
     * @returns {Promise<Array>} - Array of resources
     */
    async getResources(filters = {}) {
        try {
            logger.info('Fetching resources from Django API');

            // Build query parameters from filters
            const queryParams = {};
            if (filters.tipo) queryParams.tipo = filters.tipo;
            if (filters.disponibilidad !== undefined) queryParams.disponibilidad = filters.disponibilidad;

            const response = await this.apiClient.get('/recursos/', {
                params: queryParams,
            });

            // Check if response has the expected pagination structure
            if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
                logger.warn('Resource data is empty or has unexpected structure');
                return [];
            }

            logger.info(`Resources fetched successfully: ${response.data.count} resources found`);

            // Map Django resource fields to expected format in our application
            const resources = response.data.results.map((resource) => {
                // Determine if resource is human based on tipo
                const isHuman =
                    resource.tipo_recurso === 'Humano' ||
                    resource.tipo_recurso === 'Desarrollador' ||
                    resource.tipo_detalle?.toLowerCase().includes('desarrollador') ||
                    resource.tipo_detalle?.toLowerCase().includes('humano');

                // Check availability (consider resource available if the availability is greater than 0)
                const isAvailable = resource.disponibilidad > 0;

                // For human resources, extract their technical skills from the API response
                let technologies = [];
                if (resource.tecnologias && Array.isArray(resource.tecnologias)) {
                    technologies = resource.tecnologias;
                } else if (resource.tecnologias && typeof resource.tecnologias === 'string') {
                    technologies = resource.tecnologias.split(',').map((t) => t.trim());
                }

                // Determine experience level from cualificacion or similar field
                let experience = 'No especificado';
                if (resource.cualificacion) {
                    experience = resource.cualificacion;
                } else if (resource.experiencia) {
                    experience = resource.experiencia;
                } else if (resource.nivel) {
                    experience = resource.nivel;
                }

                return {
                    id: resource.idrecurso,
                    name: resource.nombrerecurso,
                    type: resource.tipo_recurso,
                    typeDetail: resource.tipo_detalle,
                    availability: resource.disponibilidad,
                    workload: resource.carga_trabajo,
                    role: resource.tipo_detalle || resource.tipo_recurso || 'No especificado',
                    experience: experience,
                    technologies: technologies,
                    costRate: resource.costo_hora || 0,
                    email: resource.email || '',
                    phone: resource.telefono || '',
                    skills: resource.habilidades || '',
                    department: resource.departamento || '',
                    isHuman: isHuman,
                    isAvailable: isAvailable,
                };
            });

            return resources;
        } catch (error) {
            logger.error(`Error fetching resources: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available human resources from the Django API
     * @returns {Promise<Array>} - Array of human resources
     */
    async getHumanResources() {
        try {
            logger.info('Fetching available human resources from Django API');
            return await this.getResources({ tipo: 'humano', disponibilidad: true });
        } catch (error) {
            logger.error(`Error fetching human resources: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available material resources from the Django API
     * @returns {Promise<Array>} - Array of material resources
     */
    async getMaterialResources() {
        try {
            logger.info('Fetching available material resources from Django API');
            return await this.getResources({ tipo: 'material', disponibilidad: true });
        } catch (error) {
            logger.error(`Error fetching material resources: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DjangoService();
