/**
 * @desc    Prompt templates for different AI operations
 * @author  David Sandoval
 */

/**
 * Generate a prompt for task parameterization
 * @param {Object} task - Task object
 * @returns {string} - Formatted prompt
 */
exports.taskParameterizationPrompt = (task) => {
    // Ensure task properties exist before trying to use them
    const title = task?.title || 'No title provided';
    const description = task?.description || 'No description available';
    const projectName = task?.project?.name || 'No project specified';
    const status = task?.statusDisplay || task?.status || 'No status specified';
    const priority = task?.priorityDisplay || task?.priority || 'No priority specified';
    const taskType = task?.typeDisplay || task?.type || 'Unspecified';
    const phase = task?.phaseDisplay || 'No phase specified';
    const tags = Array.isArray(task?.tags) ? task.tags.join(', ') : task?.tags || '';
    const difficulty = task?.difficulty ? `${task.difficulty}/5` : 'Unspecified';
    const estimatedDuration = task?.estimatedDuration || 'No especificado';
    const requirementDescription = task?.requirementDescription || 'No especificado';
    const clarityOfRequirements = task?.clarityOfRequirements
        ? `${Math.round(task.clarityOfRequirements * 100)}%`
        : 'No especificado';
    const startDate = task?.startDate || 'No especificado';
    const endDate = task?.endDate || 'No especificado';

    return `
# Tarea de Proyecto
Analiza la siguiente tarea y determina sus parámetros.

## Información de la Tarea
Título: ${title}
Descripción: ${description}
Proyecto: ${projectName}
Estado: ${status}
Prioridad: ${priority}
Tipo: ${taskType}
Fase: ${phase}
Etiquetas: ${tags}
Dificultad: ${difficulty}
Duración estimada: ${estimatedDuration} días
Fecha inicio: ${startDate}
Fecha fin: ${endDate}
Claridad de requisitos: ${clarityOfRequirements}
Requerimiento asociado: ${requirementDescription}

## Instrucciones
Analiza la información proporcionada y genera un análisis en formato JSON con los siguientes campos:
1. "tarea": El título exacto de la tarea tal como se proporciona arriba (usar el valor "${title}")
2. "tipo": El tipo o categoría de la tarea basado en la información proporcionada (string: "${taskType}" o derivar de la descripción si aplica)
3. "palabras_clave": Un array de palabras clave relevantes para la tarea. Incluir las etiquetas proporcionadas y añadir otras relevantes.
4. "complejidad": La complejidad estimada de la tarea (string: "Muy Baja = 1", "Baja = 2", "Media = 3", "Alta = 4", "Muy Alta = 5"), basada en la dificultad y descripción proporcionadas
5. "tiempo_estimado": Una estimación del tiempo necesario para completar la tarea (string, e.g. "${task.estimatedDuration || 3} días")
6. "claridad_requisitos": El nivel de claridad de los requisitos expresado como porcentaje (string, e.g. "80%")
7. "puntos_historia": La estimación en puntos de historia usando la secuencia de Fibonacci (1, 2, 3, 5, 8, 13, 21) basada en la complejidad y el tamaño de la tarea

IMPORTANTE: 
- El campo "tarea" debe contener el título exacto de la tarea: "${title}"
- El campo "tiempo_estimado" debe contener una estimación de tiempo con formato "X días" o "X semanas", etc.
- Usa la información proporcionada (tipo, etiquetas, dificultad) para dar una respuesta más precisa.
- Las palabras clave deben ser relevantes para la tarea y pueden incluir tecnologías, conceptos o acciones específicas, ademas de ello recuerda que son palabras clave y no frases completas. Ademas esas palabras clavese deven de sacar de la descripción de la tarea.
- Para "puntos_historia" debes asignar un valor de la serie de Fibonacci (1, 2, 3, 5, 8, 13, 21) según la complejidad y tamaño percibido.
- Para "claridad_requisitos" usa el valor proporcionado si existe o estímalo basado en la descripción.

## Formato de Respuesta
Proporciona únicamente un objeto JSON válido sin explicaciones adicionales ni texto de markdown.

Ejemplo de respuesta esperada:
{
  "tarea": "${title}",
  "tipo": "${taskType || 'Backend'}",
  "palabras_clave": ["palabras claves extraidas de la descripción"],
  "complejidad": "complejidad evaluada en base a tus criterios",
  "claridad_requisitos": "75%",
  "puntos_historia": "story points estimados por ti"
}
`;
};

/**
 * Generate a prompt for resource assignment
 * @param {Object} task - Task object
 * @param {Array} resources - Array of available resources
 * @returns {string} - Formatted prompt
 */
exports.resourceAssignmentPrompt = (task, resources) => {
    // Separate human and material resources for better prompting
    const humanResources = resources.filter((r) => r.isHuman && r.isAvailable);
    const materialResources = resources.filter((r) => !r.isHuman && r.isAvailable);

    // Format human resources text
    const humanResourcesText = humanResources
        .map(
            (r) =>
                `- ${r.name}: ${r.role || 'No role'} (Experiencia: ${r.experience || 'No especificada'}, Disponibilidad: ${r.availability || 'No especificada'}) - Tecnologías: ${(
                    r.technologies || []
                ).join(', ')}`
        )
        .join('\n');

    // Format material resources text if available
    const materialResourcesText =
        materialResources.length > 0
            ? materialResources
                  .map(
                      (r) =>
                          `- ${r.name}: ${r.type || 'Material'} (Disponibilidad: ${r.availability || 'No especificada'})`
                  )
                  .join('\n')
            : 'No hay recursos materiales disponibles.';

    // Extract task details safely with fallbacks
    const title = task?.title || 'No title provided';
    const description = task?.description || 'No hay descripción disponible';
    const projectName = task?.project?.name || 'No especificado';
    const status = task?.statusDisplay || task?.status || 'No especificado';
    const priority = task?.priorityDisplay || task?.priority || 'No especificada';
    const taskType = task?.typeDisplay || task?.type || 'No especificado';
    const difficulty = task?.difficulty ? `${task.difficulty}/5` : 'No especificado';
    const tags = Array.isArray(task?.tags) && task.tags.length ? task.tags.join(', ') : 'No especificado';
    const estimatedDuration = task?.estimatedDuration || 'No especificado';
    const startDate = task?.startDate || 'No especificado';
    const endDate = task?.endDate || 'No especificado';
    const requirementDescription = task?.requirementDescription || 'No especificado';
    const clarityOfRequirements = task?.clarityOfRequirements
        ? `${Math.round(task.clarityOfRequirements * 100)}%`
        : 'No especificado';

    return `
# Asignación de Recursos
Determina el recurso más adecuado para la siguiente tarea.

## Información de la Tarea
Título: ${title}
Descripción: ${description}
Proyecto: ${projectName}
Estado: ${status}
Prioridad: ${priority}
Tipo: ${taskType}
Dificultad: ${difficulty}
Etiquetas: ${tags}
Duración estimada: ${estimatedDuration} días
Fecha inicio: ${startDate}
Fecha fin: ${endDate}
Claridad de requisitos: ${clarityOfRequirements}
Requerimiento asociado: ${requirementDescription}

## Recursos Humanos Disponibles
${humanResourcesText || 'No hay recursos humanos disponibles.'}

## Recursos Materiales Disponibles
${materialResourcesText}

## Instrucciones
Analiza la tarea y los recursos disponibles para determinar:
1. El recurso humano más adecuado para esta tarea basándote en sus habilidades técnicas, experiencia y disponibilidad.
2. El recurso humano DEBE ser asignado de la lista de recursos humanos disponibles.
3. La asignación debe maximizar la eficiencia y calidad del trabajo.

## Formato de Respuesta
Proporciona la respuesta en formato JSON con los siguientes campos:
1. "tarea": Título de la tarea
2. "recurso_asignado": Objeto con la siguiente estructura:
   - "desarrollador": Nombre del recurso humano asignado (OBLIGATORIO)
   - "nivel": Nivel del desarrollador ("Junior", "Mid", "Senior")
   - "tecnología": Tecnología principal requerida para la tarea
   - "herramientas": Array de herramientas necesarias para la tarea

JSON:
`;
};

/**
 * Generate a prompt for project resource assignment
 * @param {Object} project - Project object
 * @param {Array} tasks - Array of project tasks
 * @param {Array} resources - Array of available resources
 * @returns {string} - Formatted prompt
 */
exports.projectResourceAssignmentPrompt = (project, tasks, resources) => {
    const tasksText = tasks
        .map(
            (t) =>
                `- ID: ${t.id}, Título: ${t.title}, Descripción: ${t.description || 'No disponible'}, Prioridad: ${
                    t.priority || 'No especificada'
                }`
        )
        .join('\n');

    const resourcesText = resources
        .map(
            (r) =>
                `- ${r.name}: ${r.role || 'No role'} (${r.experience || 'No experience'}) - Disponibilidad: ${
                    r.availability || 'No disponible'
                } - Tecnologías: ${(r.technologies || []).join(', ')}`
        )
        .join('\n');

    return `
# Asignación de Recursos para Proyecto
Determina la asignación óptima de recursos para el siguiente proyecto.

## Información del Proyecto
Título: ${project.name}
Descripción: ${project.description || 'No hay descripción disponible'}

## Tareas del Proyecto
${tasksText}

## Recursos Disponibles
${resourcesText}

## Instrucciones
Analiza las tareas del proyecto y los recursos disponibles para determinar la asignación óptima de recursos.
Considera habilidades técnicas, experiencia, disponibilidad y otros factores relevantes.
Cada tarea debe asignarse a un solo recurso, pero un recurso puede tener varias tareas.

## Formato de Respuesta
Proporciona la respuesta en formato JSON con los siguientes campos:
1. "proyecto": Nombre del proyecto
2. "equipo_sugerido": Array con los nombres de los desarrolladores asignados
3. "tareas_asignadas": Objeto donde las claves son los nombres de los desarrolladores y los valores son las tareas asignadas

JSON:
`;
};

/**
 * Generate a prompt for code suggestion
 * @param {string} codePrompt - User prompt for code
 * @param {Object} task - Related task (optional)
 * @returns {string} - Formatted prompt
 */
exports.codeSuggestionPrompt = (codePrompt, task = null) => {
    let contextSection = '';

    if (task) {
        contextSection = `
## Contexto de la Tarea
Título: ${task.title}
Descripción: ${task.description || 'No hay descripción disponible'}
`;
    }

    return `
# Sugerencia de Código
${contextSection}
## Solicitud
${codePrompt}

## Instrucciones
Proporciona código que resuelva la solicitud anterior. Asegúrate de que sea:
1. Funcional y optimizado
2. Bien comentado y explicado
3. Siguiendo las mejores prácticas

## Formato de Respuesta
Proporciona el código con una breve explicación de lo que hace. Usa bloques de código markdown.
`;
};

/**
 * Generate a prompt for project analysis
 * @param {Object} project - Project object
 * @param {Array} tasks - Array of project tasks
 * @returns {string} - Formatted prompt
 */
exports.projectAnalysisPrompt = (project, tasks) => {
    const tasksText = tasks
        .map((t) => `- ${t.title}: ${t.description || 'No disponible'} (Estado: ${t.status || 'No especificado'})`)
        .join('\n');

    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending' || !t.status).length;
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `
# Análisis de Proyecto
Analiza el siguiente proyecto y su estado actual.

## Información del Proyecto
Título: ${project.name}
Descripción: ${project.description || 'No hay descripción disponible'}

## Estado Actual
- Tareas completadas: ${completedTasks} (${completionPercentage}%)
- Tareas en progreso: ${inProgressTasks}
- Tareas pendientes: ${pendingTasks}
- Total de tareas: ${totalTasks}

## Tareas
${tasksText}

## Instrucciones
Analiza la información proporcionada y genera un informe ejecutivo del proyecto que incluya:
1. Resumen del estado actual
2. Análisis de progreso
3. Posibles riesgos o cuellos de botella
4. Recomendaciones

## Formato de Respuesta
Proporciona un informe estructurado en formato Markdown.
`;
};

/**
 * Generate a general chat prompt
 * @param {string} userPrompt - User message
 * @param {Array} chatHistory - Previous messages in the chat (optional)
 * @returns {string} - Formatted prompt
 */
exports.generalChatPrompt = (userPrompt, chatHistory = []) => {
    let historyText = '';

    if (chatHistory.length > 0) {
        historyText = chatHistory
            .map(
                (msg) =>
                    `${msg.requestType === 'user_message' ? 'Usuario' : 'Asistente'}: ${
                        msg.requestType === 'user_message' ? msg.prompt : msg.response.content
                    }`
            )
            .join('\n\n');

        historyText = `
## Historial de Conversación
${historyText}
`;
    }

    return `
# Asistente IA para Gestión de Proyectos

Eres un asistente especializado en gestión de proyectos de software, desarrollo y metodologías ágiles.
${historyText}
## Mensaje Actual del Usuario
${userPrompt}

## Instrucciones
Responde al mensaje del usuario de manera directa, profesional y útil.
Proporciona información precisa y ejemplos prácticos cuando sea posible.
Si hay código, formátalo correctamente utilizando bloques de código markdown.
Si no sabes la respuesta, indícalo honestamente sin inventar información.
`;
};

/**
 * Generate a prompt for task documentation
 * @param {Object} task - Task object
 * @returns {string} - Formatted prompt
 */
exports.taskDocumentationPrompt = (task) => {
    const title = task?.title || 'No title provided';
    const description = task?.description || 'No hay descripción disponible';
    const projectName = task?.project?.name || 'No especificado';
    const status = task?.statusDisplay || task?.status || 'No especificado';
    const taskType = task?.typeDisplay || task?.type || 'No especificado';
    const requirementDescription = task?.requirementDescription || 'No especificado';
    const clarityOfRequirements = task?.clarityOfRequirements
        ? `${Math.round(task.clarityOfRequirements * 100)}%`
        : 'No especificado';

    return `
# Generación de Documentación para Tarea
Genera documentación técnica para la siguiente tarea.

## Información de la Tarea
Título: ${title}
Descripción: ${description}
Proyecto: ${projectName}
Estado: ${status}
Tipo: ${taskType}
Claridad de requisitos: ${clarityOfRequirements}
Requerimiento asociado: ${requirementDescription}

## Instrucciones
Basándote en la información proporcionada, genera documentación técnica que incluya:
1. Resumen general de la tarea
2. Requisitos técnicos
3. Pasos de implementación sugeridos
4. Consideraciones importantes
5. Criterios de aceptación

## Formato de Respuesta
Proporciona la documentación en formato Markdown, con secciones claramente definidas y ejemplos cuando sea útil.
`;
};

/**
 * Generate a prompt for estimating time required for a task
 * @param {Object} task - Task object
 * @param {Object} developer - Developer object (optional)
 * @returns {string} - Formatted prompt
 */
exports.taskTimeEstimationPrompt = (task, developer = null) => {
    let developerSection = '';

    if (developer) {
        developerSection = `
## Información del Desarrollador
Nombre: ${developer.name}
Experiencia: ${developer.experience || 'No especificada'}
Rol: ${developer.role || 'No especificado'}
Tecnologías: ${(developer.technologies || []).join(', ')}
`;
    }

    const title = task?.title || 'No title provided';
    const description = task?.description || 'No hay descripción disponible';
    const projectName = task?.project?.name || 'No especificado';
    const status = task?.statusDisplay || task?.status || 'No especificado';
    const taskType = task?.typeDisplay || task?.type || 'No especificado';
    const difficulty = task?.difficulty ? `${task.difficulty}/5` : 'No especificado';
    const estimatedDuration = task?.estimatedDuration || 'No especificado';
    const clarityOfRequirements = task?.clarityOfRequirements
        ? `${Math.round(task.clarityOfRequirements * 100)}%`
        : 'No especificado';
    const tags = Array.isArray(task?.tags) && task.tags.length ? task.tags.join(', ') : 'No especificado';

    return `
# Estimación de Tiempo para Tarea
Realiza una estimación del tiempo necesario para completar la siguiente tarea.

## Información de la Tarea
Título: ${title}
Descripción: ${description}
Proyecto: ${projectName}
Estado: ${status}
Tipo: ${taskType}
Dificultad: ${difficulty}
Etiquetas: ${tags}
Duración estimada actual: ${estimatedDuration} días
Claridad de requisitos: ${clarityOfRequirements}
${developerSection}
## Instrucciones
Basándote en la información proporcionada, estima el tiempo que tomaría completar esta tarea.
Considera los siguientes factores:
- Complejidad de la tarea
- Tecnologías involucradas
- Experiencia necesaria
- Posibles obstáculos o dependencias

## Formato de Respuesta
Proporciona la respuesta en formato JSON con los siguientes campos:
1. "estimacion_optimista": Tiempo esperado en condiciones ideales (string, e.g. "2 días")
2. "estimacion_probable": Tiempo esperado en condiciones normales (string, e.g. "4 días")
3. "estimacion_pesimista": Tiempo esperado considerando posibles dificultades (string, e.g. "7 días")
4. "estimacion_recomendada": Tu estimación final recomendada (string, e.g. "5 días")
5. "factores_considerados": Array de factores que influyen en la estimación
6. "confianza": Nivel de confianza en la estimación (número del 1-10)

JSON:
`;
};
