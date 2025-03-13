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

        // Fetch available resources
        const resources = await djangoService.getResources();

        // Generate prompt for resource assignment
        const prompt = promptTemplates.resourceAssignmentPrompt(task, resources);

        // Generate response using Ollama
        logger.info(`Assigning resources for task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'resource assignment JSON');

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

        // Fetch available resources
        const resources = await djangoService.getResources();

        // Generate prompt for project resource assignment
        const prompt = promptTemplates.projectResourceAssignmentPrompt(project, tasks, resources);

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
