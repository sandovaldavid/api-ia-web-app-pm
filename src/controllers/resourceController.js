const djangoService = require('../services/djangoService');
const ollamaService = require('../services/ollamaService');
const promptTemplates = require('../utils/promptTemplates');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Assign resources to a task with AI
 * @route   GET /api/resources/assign/:taskId
 * @access  Private
 */
exports.assignResourceToTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // Check cache first
        const cacheKey = `resource_assignment_${taskId}`;
        const cachedResult = cacheService.get(cacheKey);

        if (cachedResult) {
            logger.info(`Using cached resource assignment for task ${taskId}`);
            return res.status(200).json({
                success: true,
                data: cachedResult,
            });
        }

        // Fetch task from Django API
        const task = await djangoService.getTaskById(taskId);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Fetch available human resources directly using the dedicated endpoint
        const humanResources = await djangoService.getHumanResources();

        // Check if human resources are available
        if (humanResources.length === 0) {
            return next(new AppError('No hay recursos humanos disponibles para asignar a esta tarea', 422));
        }

        // Fetch available material resources
        const materialResources = await djangoService.getMaterialResources();

        // Combine resources for the prompt template
        const allResources = [...humanResources, ...materialResources];

        // Log available resources
        logger.info(
            `Found ${humanResources.length} available human resources and ${materialResources.length} material resources`
        );

        // Generate prompt for resource assignment
        const prompt = promptTemplates.resourceAssignmentPrompt(task, allResources);

        // Generate response using Ollama
        logger.info(`Assigning resources for task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'resource assignment JSON');

        // Validate that the response includes at least one human resource
        let validResponse = true;
        if (!response.recurso_asignado || !response.recurso_asignado.desarrollador) {
            logger.warn('AI response did not include a human resource assignment');
            validResponse = false;
        }

        // If the response isn't valid, assign the most suitable human resource manually
        if (!validResponse && humanResources.length > 0) {
            // Simple fallback - assign the first available human resource
            logger.info('Falling back to default resource assignment');
            response.recurso_asignado = {
                desarrollador: humanResources[0].name,
                nivel: humanResources[0].experience || 'No especificado',
                tecnología:
                    humanResources[0].technologies && humanResources[0].technologies.length > 0
                        ? humanResources[0].technologies[0]
                        : 'No especificado',
                herramientas: [],
            };
        }

        // Cache the result
        cacheService.set(cacheKey, response);

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        logger.error(`Error assigning resources: ${error.message}`);
        next(new AppError(`Error assigning resources: ${error.message}`, 500));
    }
};

/**
 * @desc    Assign resources to a project with AI
 * @route   GET /api/resources/assign/project/:projectId
 * @access  Private
 */
exports.assignResourcesForProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Fetch project from Django API
        const project = await djangoService.getProjectById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        // Fetch tasks for the project
        const tasks = await djangoService.getTasksByProject(projectId);

        // Fetch available resources using dedicated endpoints
        const humanResources = await djangoService.getHumanResources();
        const materialResources = await djangoService.getMaterialResources();

        // Combine resources for the prompt template
        const allResources = [...humanResources, ...materialResources];

        // Check if human resources are available
        if (humanResources.length === 0) {
            return res.status(422).json({
                success: false,
                error: 'No hay recursos humanos disponibles para asignar a este proyecto',
            });
        }

        // Generate prompt for project resource assignment
        const prompt = promptTemplates.projectResourceAssignmentPrompt(project, tasks, allResources);

        // Generate response using Ollama
        logger.info(`Assigning resources for project ${projectId}: ${project.name}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'project resource assignment JSON');

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        logger.error(`Error assigning project resources: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error assigning project resources',
            message: error.message,
        });
    }
};

/**
 * @desc    Get all available resources
 * @route   GET /api/resources
 * @access  Private
 */
exports.getResources = async (req, res) => {
    try {
        const resources = await djangoService.getResources();

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources,
        });
    } catch (error) {
        logger.error(`Error getting resources: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error getting resources',
            message: error.message,
        });
    }
};

/**
 * @desc    Get resources for a project
 * @route   GET /api/resources/project/:projectId
 * @access  Private
 */
exports.getProjectResources = async (req, res) => {
    try {
        const { projectId } = req.params;

        const resources = await djangoService.getResourcesByProject(projectId);

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources,
        });
    } catch (error) {
        logger.error(`Error getting project resources: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error getting project resources',
            message: error.message,
        });
    }
};
