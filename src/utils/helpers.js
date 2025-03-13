const logger = require('./logger');

/**
 * Formatea una tarea para el prompt de Ollama para parametrización
 * @param {Object} task - La tarea obtenida de la API de Django
 * @returns {String} - El prompt formateado
 */
const formatTaskPrompt = (task) => {
    return `
  Analiza la siguiente tarea de un proyecto de software y devuelve un JSON con los parámetros de la tarea:
  
  Título: ${task.title}
  Descripción: ${task.description}
  Proyecto: ${task.project?.name || 'No especificado'}
  
  Devuelve ÚNICAMENTE un JSON con la siguiente estructura:
  {
    "tarea": "Nombre de la tarea",
    "tipo": "Tipo de tarea (Desarrollo Frontend, Backend, etc)",
    "palabras_clave": ["palabra1", "palabra2", ...],
    "complejidad": "Baja, Media o Alta",
    "tiempo_estimado": "Tiempo en días"
  }
  `;
};

/**
 * Formatea tareas para el prompt de Ollama para asignación de recursos
 * @param {Object} task - La tarea obtenida de la API de Django
 * @param {Array} resources - Lista de recursos disponibles
 * @returns {String} - El prompt formateado
 */
const formatResourceAssignmentPrompt = (task, resources) => {
    const resourcesDescription = resources
        .map((r) => `- ${r.name}: ${r.role}, Experiencia: ${r.experience}, Tecnologías: ${r.technologies.join(', ')}`)
        .join('\n');

    return `
  Analiza la siguiente tarea y los recursos disponibles. Asigna el mejor recurso para esta tarea:
  
  Tarea: ${task.title}
  Descripción: ${task.description}
  
  Recursos disponibles:
  ${resourcesDescription}
  
  Devuelve ÚNICAMENTE un JSON con la siguiente estructura:
  {
    "tarea": "${task.title}",
    "recurso_asignado": {
      "desarrollador": "Nombre del desarrollador",
      "nivel": "Junior/Mid/Senior",
      "tecnología": "Tecnología principal",
      "herramientas": ["Herramienta1", "Herramienta2", ...]
    }
  }
  `;
};

/**
 * Parsea la respuesta de Ollama para extraer el JSON
 * @param {String} response - Respuesta de Ollama
 * @returns {Object} - Objeto JSON parseado
 */
const parseOllamaResponse = (response) => {
    try {
        // Buscar contenido que parezca JSON con expresión regular
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonContent = jsonMatch[0];
            return JSON.parse(jsonContent);
        }
        throw new Error('No se encontró un JSON válido en la respuesta');
    } catch (error) {
        logger.error(`Error al parsear respuesta de Ollama: ${error.message}`);
        throw new Error('Error al procesar la respuesta de la IA');
    }
};

/**
 * @desc    Helper functions for common tasks
 */

/**
 * Format task data for prompt
 * @param {Object} task - Task object
 * @returns {string} - Formatted task description
 */
exports.formatTaskPrompt = (task) => {
    let prompt = '';

    if (task.title) {
        prompt += `# ${task.title}\n\n`;
    }

    if (task.description) {
        prompt += `${task.description}\n\n`;
    }

    if (task.status) {
        prompt += `Estado: ${task.status}\n`;
    }

    if (task.priority) {
        prompt += `Prioridad: ${task.priority}\n`;
    }

    if (task.project && task.project.name) {
        prompt += `Proyecto: ${task.project.name}\n`;
    }

    return prompt.trim();
};

/**
 * Format JSON for API responses
 * @param {Object} data - Data to format
 * @param {string} message - Success message
 * @returns {Object} - Formatted response
 */
exports.formatResponse = (data, message = 'Operation successful') => {
    return {
        success: true,
        message,
        data,
    };
};

/**
 * Format error for API responses
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error
 */
exports.formatError = (message, statusCode = 500) => {
    return {
        success: false,
        error: message,
        statusCode,
    };
};

/**
 * Calculate pagination data
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination data
 */
exports.getPaginationData = (total, page, limit) => {
    return {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

/**
 * Sanitize user input to prevent injection
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
exports.sanitizeInput = (input) => {
    if (!input) return '';

    // Basic sanitization
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Check if a value is a valid MongoDB ObjectID
 * @param {string} id - ID to check
 * @returns {boolean} - True if valid ObjectID
 */
exports.isValidObjectId = (id) => {
    const ObjectId = require('mongoose').Types.ObjectId;
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

/**
 * Format date to human-readable string
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
exports.formatDate = (date) => {
    return new Date(date).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Parse boolean from string
 * @param {string} value - String value
 * @returns {boolean} - Parsed boolean
 */
exports.parseBoolean = (value) => {
    if (!value) return false;
    return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
};

module.exports = {
    formatTaskPrompt,
    formatResourceAssignmentPrompt,
    parseOllamaResponse,
};
