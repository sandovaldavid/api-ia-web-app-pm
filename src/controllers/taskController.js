const djangoService = require('../services/djangoService');
const ollamaService = require('../services/ollamaService');
const promptTemplates = require('../utils/promptTemplates');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Parameterize a task with AI
 * @route   GET /api/tasks/:taskId/parameterize
 * @access  Private
 */
exports.parameterizeTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // Check cache first
        const cacheKey = `task_parameterization_${taskId}`;
        const cachedResult = cacheService.get(cacheKey);

        if (cachedResult) {
            logger.info(`Using cached parameterization for task ${taskId}`);
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

        // Generate prompt for task parameterization
        const prompt = promptTemplates.taskParameterizationPrompt(task);

        // Generate response using Ollama
        logger.info(`Parameterizing task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'task parameterization JSON');

        // Cache the result
        cacheService.set(cacheKey, response);

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        logger.error(`Error parameterizing task: ${error.message}`);
        next(new AppError(`Error parameterizing task: ${error.message}`, 500));
    }
};

/**
 * @desc    Generate documentation for a task with AI
 * @route   GET /api/tasks/:taskId/documentation
 * @access  Private
 */
exports.generateDocumentation = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // Fetch task from Django API
        const task = await djangoService.getTaskById(taskId);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Generate prompt for documentation
        const prompt = promptTemplates.taskDocumentationPrompt(task);

        // Generate response using Ollama
        logger.info(`Generating documentation for task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateCompletion(prompt);

        res.status(200).json({
            success: true,
            data: {
                taskId,
                taskTitle: task.title,
                documentation: response,
            },
        });
    } catch (error) {
        logger.error(`Error generating documentation: ${error.message}`);
        next(new AppError(`Error generating documentation: ${error.message}`, 500));
    }
};

/**
 * @desc    Estimate time required for a task with AI
 * @route   GET /api/tasks/:taskId/estimate
 * @access  Private
 */
exports.estimateTaskTime = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { developerId } = req.query;

        // Fetch task from Django API
        const task = await djangoService.getTaskById(taskId);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        let developer = null;

        // If developerId is provided, fetch developer info
        if (developerId) {
            const resources = await djangoService.getResources();
            developer = resources.find((r) => r.id === developerId);
        }

        // Generate prompt for time estimation
        const prompt = promptTemplates.taskTimeEstimationPrompt(task, developer);

        // Generate response using Ollama
        logger.info(`Estimating time for task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'task time estimation JSON');

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        logger.error(`Error estimating task time: ${error.message}`);
        next(new AppError(`Error estimating task time: ${error.message}`, 500));
    }
};

/**
 * @desc    Analyze project with AI
 * @route   GET /api/tasks/projects/:projectId/analyze
 * @access  Private
 */
exports.analyzeProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Fetch project from Django API
        const project = await djangoService.getProjectById(projectId);

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        // Fetch tasks for the project
        const tasks = await djangoService.getTasksByProject(projectId);

        // Generate prompt for project analysis
        const prompt = promptTemplates.projectAnalysisPrompt(project, tasks);

        // Generate response using Ollama
        logger.info(`Analyzing project ${projectId}: ${project.name}`);

        const response = await ollamaService.generateCompletion(prompt);

        res.status(200).json({
            success: true,
            data: {
                projectId,
                projectName: project.name,
                analysis: response,
            },
        });
    } catch (error) {
        logger.error(`Error analyzing project: ${error.message}`);
        next(new AppError(`Error analyzing project: ${error.message}`, 500));
    }
};
