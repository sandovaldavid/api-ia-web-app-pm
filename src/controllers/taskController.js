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
        logger.info(`Fetching task ${taskId} from Django API for parameterization`);
        const task = await djangoService.getTaskById(taskId);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Log task details for debugging to ensure we have the correct fields
        logger.debug.info(`Task fields available: ${Object.keys(task).join(', ')}`);

        // Enhanced validation for required fields
        if (!task.title) {
            logger.warn(`Task ${taskId} has no title, which may cause inaccurate parameterization`);
        }

        if (!task.description) {
            logger.warn(`Task ${taskId} has no description, which may result in limited analysis`);
        }

        // Generate prompt for task parameterization
        const prompt = promptTemplates.taskParameterizationPrompt(task);

        // Log prompt for debugging
        logger.debug.info(`Generated prompt for task parameterization: ${prompt}`);

        // Generate response using Ollama
        logger.info(`Parameterizing task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateJSONCompletion(prompt, 'task parameterization JSON');

        // Log the AI response for debugging
        logger.debug.info(`Raw AI response: ${JSON.stringify(response)}`);

        // Enhanced validation for response data
        if (!response || !response.tarea) {
            logger.warn(`Empty or invalid parameterization response for task ${taskId}`);

            // Force fix the response if needed
            if (response) {
                if (!response.tarea || response.tarea === 'No title provided') {
                    response.tarea = task.title;
                }

                if (!response.tiempo_estimado || response.tiempo_estimado === 'No estimate provided') {
                    response.tiempo_estimado = task.estimatedDuration ? `${task.estimatedDuration} días` : '5 días';
                }

                if (!response.tipo || response.tipo === 'Unspecified') {
                    response.tipo = task.typeDisplay || 'Backend';
                }

                if (!response.palabras_clave || response.palabras_clave.length === 0) {
                    // Use tags if available
                    response.palabras_clave =
                        task.tags && task.tags.length > 0 ? task.tags : ['desarrollo', 'software'];
                }

                if (!response.complejidad || response.complejidad === '') {
                    // Map difficulty (1-5) to complexity (Low, Medium, High)
                    const difficultyMap = {
                        1: 'Baja',
                        2: 'Baja',
                        3: 'Media',
                        4: 'Alta',
                        5: 'Alta',
                    };
                    response.complejidad = task.difficulty ? difficultyMap[task.difficulty] || 'Media' : 'Media';
                }
            }
        }

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

        // Check cache first
        const cacheKey = `task_documentation_${taskId}`;
        const cachedResult = cacheService.get(cacheKey);

        if (cachedResult) {
            logger.info(`Using cached documentation for task ${taskId}`);
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

        // Generate prompt for documentation
        const prompt = promptTemplates.taskDocumentationPrompt(task);

        // Generate response using Ollama
        logger.info(`Generating documentation for task ${taskId}: ${task.title}`);

        const response = await ollamaService.generateCompletion(prompt);

        // Cache the result
        cacheService.set(cacheKey, {
            taskId,
            taskTitle: task.title,
            documentation: response,
        });

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

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
    try {
        // Extract task data from request body
        const taskData = req.body;

        logger.info(`Creating new task: ${taskData.title}`);

        // Create task in Django API
        const createdTask = await djangoService.createTask(taskData);

        // If AI enhancement is requested, process with AI
        if (req.query.enhance === 'true') {
            logger.info(`Enhancing task with AI: ${createdTask.id}`);

            // Generate prompt for task enhancement
            const prompt = promptTemplates.taskEnhancementPrompt(createdTask);

            // Get AI suggestions
            const aiSuggestions = await ollamaService.generateJSONCompletion(prompt, 'task enhancement JSON');

            // Update task with AI suggestions
            const updatedTask = {
                ...createdTask,
                description: aiSuggestions.enhanced_description || createdTask.description,
                priority: aiSuggestions.suggested_priority || createdTask.priority,
                estimated_hours: aiSuggestions.estimated_hours || createdTask.estimated_hours,
            };

            // Update task in Django
            const enhancedTask = await djangoService.updateTask(createdTask.id, updatedTask);

            return res.status(201).json({
                success: true,
                message: 'Task created and enhanced with AI',
                data: enhancedTask,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: createdTask,
        });
    } catch (error) {
        logger.error(`Error creating task: ${error.message}`);
        next(new AppError(`Error creating task: ${error.message}`, 500));
    }
};

/**
 * @desc    Update an existing task
 * @route   PUT /api/tasks/:taskId
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const taskData = req.body;

        // Check if task exists
        const taskExists = await djangoService.getTaskById(taskId);

        if (!taskExists) {
            return next(new AppError('Task not found', 404));
        }

        logger.info(`Updating task ${taskId}: ${taskData.title || taskExists.title}`);

        // Update task in Django API
        const updatedTask = await djangoService.updateTask(taskId, taskData);

        // Clear cache for this task if it exists
        const cacheKey = `task_parameterization_${taskId}`;
        if (cacheService.get(cacheKey)) {
            logger.info(`Clearing cache for task ${taskId}`);
            cacheService.del(cacheKey);
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask,
        });
    } catch (error) {
        logger.error(`Error updating task: ${error.message}`);
        next(new AppError(`Error updating task: ${error.message}`, 500));
    }
};

/**
 * @desc    Get a task by ID
 * @route   GET /api/tasks/:taskId
 * @access  Private
 */
exports.getTaskById = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        logger.info(`Getting task details for ${taskId}`);

        // Get task from Django API
        const task = await djangoService.getTaskById(taskId);

        logger.info(`Task details fetched for ${taskId}`);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        logger.error(`Error fetching task: ${error.message}`);
        next(new AppError(`Error fetching task: ${error.message}`, 500));
    }
};
