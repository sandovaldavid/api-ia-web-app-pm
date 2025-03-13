# 🔧 Casos de Uso Avanzados

Esta guía muestra casos de uso avanzados para la API Intermediaria IA, demostrando cómo integrarla en diferentes flujos de trabajo de gestión de proyectos.

## 📊 Análisis de Viabilidad Automatizado

Este caso de uso utiliza la IA para analizar y determinar la viabilidad de un proyecto a partir de su descripción y requisitos.

### Implementación

```javascript
async function analizarViabilidadProyecto(descripcion, requisitos) {
  // Formatear el prompt para el análisis
  const prompt = `
  Analiza la viabilidad de este proyecto:
  
  Descripción: ${descripcion}
  
  Requisitos técnicos:
  ${requisitos.join('\n')}
  
  Evalúa los siguientes aspectos:
  1. Complejidad técnica (escala 1-10)
  2. Recursos necesarios (personal, tecnologías)
  3. Tiempo estimado
  4. Posibles obstáculos
  5. Recomendaciones
  
  Devuelve el resultado en formato JSON.
  `;
  
  try {
    const response = await axios.post('/api/chats', {
      title: 'Análisis de viabilidad'
    });
    
    const chatId = response.data.data._id;
    
    const result = await axios.post(`/api/chats/${chatId}/messages`, {
      prompt,
      requestType: 'project_context'
    });
    
    return JSON.parse(result.data.data.aiMessage.response.content);
  } catch (error) {
    console.error('Error en análisis de viabilidad:', error);
    throw error;
  }
}
```

### Ejemplo de resultado

```json
{
  "complejidad_tecnica": 7,
  "recursos_necesarios": {
    "personal": ["Frontend (2)", "Backend (2)", "DevOps (1)"],
    "tecnologias": ["React", "Node.js", "MongoDB", "Docker"]
  },
  "tiempo_estimado": "4 meses",
  "posibles_obstaculos": [
    "Integración con sistemas legacy",
    "Escalabilidad de microservicios"
  ],
  "recomendaciones": [
    "Dividir el proyecto en fases incrementales",
    "Comenzar con un MVP enfocado en funcionalidades core",
    "Implementar CI/CD desde el inicio"
  ],
  "viabilidad_general": "Media-Alta"
}
```

## 🔎 Detección de Dependencias entre Tareas

Este caso de uso detecta automáticamente dependencias entre tareas de un proyecto y sugiere la secuencia óptima.

### Implementación

```javascript
async function detectarDependenciasTareas(projectId) {
  try {
    // Obtener todas las tareas del proyecto
    const tasksResponse = await axios.get(`/api/projects/${projectId}/tasks`);
    const tasks = tasksResponse.data;
    
    // Formatear las tareas para el análisis
    const tasksText = tasks.map(task => 
      `ID: ${task.id} - ${task.title}: ${task.description}`
    ).join('\n\n');
    
    // Crear el prompt
    const prompt = `
    Analiza las siguientes tareas de un proyecto y detecta dependencias entre ellas:
    
    ${tasksText}
    
    Genera un grafo de dependencias en formato JSON con esta estructura:
    {
      "tasks": [
        {
          "id": "task_id",
          "title": "título tarea",
          "dependencies": ["id_tarea_dependencia1", "id_tarea_dependencia2"]
        }
      ],
      "secuencia_sugerida": ["id_tarea1", "id_tarea2", ...]
    }
    `;
    
    // Enviar a IA para análisis
    const response = await axios.post('/api/chats', {
      title: 'Análisis de dependencias',
      projectId
    });
    
    const chatId = response.data.data._id;
    
    const result = await axios.post(`/api/chats/${chatId}/messages`, {
      prompt,
      requestType: 'project_context',
      projectId
    });
    
    return JSON.parse(result.data.data.aiMessage.response.content);
  } catch (error) {
    console.error('Error en detección de dependencias:', error);
    throw error;
  }
}
```

### Visualización de Dependencias

Puedes representar gráficamente las dependencias utilizando bibliotecas como D3.js:

```javascript
function visualizarDependencias(dependenciasJSON) {
  // Configura la visualización con D3.js o similar
  const nodes = dependenciasJSON.tasks.map(task => ({
    id: task.id,
    label: task.title
  }));
  
  const edges = [];
  dependenciasJSON.tasks.forEach(task => {
    task.dependencies.forEach(depId => {
      edges.push({
        from: depId,
        to: task.id,
        arrows: "to"
      });
    });
  });
  
  // Renderizar el gráfico con la biblioteca de visualización preferida
}
```

## 🤖 Generación de Informes Automáticos

Este caso de uso genera automáticamente informes de progreso a partir de datos de tareas y avance.

### Implementación

```javascript
async function generarInformeProgreso(projectId, periodoInforme) {
  try {
    // Obtener datos del proyecto
    const projectResponse = await axios.get(`/api/projects/${projectId}`);
    const project = projectResponse.data;
    
    // Obtener tareas del proyecto
    const tasksResponse = await axios.get(`/api/projects/${projectId}/tasks`);
    const tasks = tasksResponse.data;
    
    // Estadísticas básicas
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    const completionRate = (completedTasks.length / tasks.length * 100).toFixed(1);
    
    // Formatear datos para el prompt
    const prompt = `
    Genera un informe de progreso para el proyecto:
    
    Nombre del proyecto: ${project.name}
    Descripción: ${project.description}
    Período del informe: ${periodoInforme}
    
    Estadísticas:
    - Tareas completadas: ${completedTasks.length} (${completionRate}%)
    - Tareas en progreso: ${inProgressTasks.length}
    - Tareas pendientes: ${pendingTasks.length}
    - Total tareas: ${tasks.length}
    
    Tareas completadas recientemente:
    ${completedTasks.slice(0, 5).map(t => `- ${t.title}`).join('\n')}
    
    Próximas tareas importantes:
    ${pendingTasks.slice(0, 5).map(t => `- ${t.title}`).join('\n')}
    
    Genera un informe ejecutivo estructurado que incluya:
    1. Resumen ejecutivo
    2. Logros principales
    3. Desafíos encontrados
    4. Próximos pasos
    5. Recomendaciones
    
    El informe debe estar en formato Markdown con secciones bien definidas.
    `;
    
    // Enviar a IA para generación del informe
    const response = await axios.post('/api/chats', {
      title: `Informe ${periodoInforme}`,
      projectId
    });
    
    const chatId = response.data.data._id;
    
    const result = await axios.post(`/api/chats/${chatId}/messages`, {
      prompt,
      requestType: 'project_context',
      projectId
    });
    
    return result.data.data.aiMessage.response.content;
  } catch (error) {
    console.error('Error en generación de informe:', error);
    throw error;
  }
}
```

### Ejemplo de informe generado

```markdown
# Informe de Progreso: Proyecto API REST - Q2 2023

## 1. Resumen Ejecutivo

El proyecto ha avanzado según lo planificado, con un 67.5% de las tareas completadas a la fecha. Se ha logrado implementar la autenticación JWT y la estructura base de la API REST. Los desafíos actuales incluyen integración con servicios externos y escalabilidad.

## 2. Logros Principales

- Implementación completa del sistema de autenticación con JWT
- Desarrollo de endpoints core para gestión de usuarios
- Configuración de CI/CD para despliegue continuo
- Documentación API con Swagger completada al 80%

## 3. Desafíos Encontrados

- La integración con el sistema legacy ha requerido más tiempo del estimado
- Se identificaron problemas de rendimiento en consultas complejas
- Es necesario reforzar las pruebas de seguridad

## 4. Próximos Pasos

- Completar endpoints de gestión de recursos
- Implementar caché para optimizar rendimiento
- Finalizar documentación técnica
- Realizar pruebas de carga

## 5. Recomendaciones

- Considerar incorporar un desarrollador adicional para acelerar implementación
- Evaluar migración a sistema de mensajería asíncrona para operaciones pesadas
- Revisar arquitectura de microservicios para escalar componentes críticos
```

## 📱 Integración Automatizada de Feedback

Este caso de uso utiliza la IA para procesar automáticamente el feedback de los usuarios y convertirlo en tareas accionables.

### Implementación

```javascript
async function procesarFeedbackUsuario(feedbackTexto, projectId) {
  try {
    const prompt = `
    Analiza el siguiente feedback de usuario y extrae:
    1. Problemas principales identificados
    2. Sugerencias de mejora
    3. Prioridad (Alta/Media/Baja)
    4. Tareas accionables para el equipo
    
    Feedback del usuario:
    "${feedbackTexto}"
    
    Devuelve el resultado en formato JSON.
    `;
    
    // Enviar a IA para análisis
    const response = await axios.post('/api/chats', {
      title: 'Análisis de feedback',
      projectId
    });
    
    const chatId = response.data.data._id;
    
    const result = await axios.post(`/api/chats/${chatId}/messages`, {
      prompt,
      requestType: 'project_context',
      projectId
    });
    
    return JSON.parse(result.data.data.aiMessage.response.content);
  } catch (error) {
    console.error('Error en procesamiento de feedback:', error);
    throw error;
  }
}
```

## 🏗️ Mejores Prácticas

1. **Cacheo de Respuestas**: Para casos de uso que generan respuestas similares frecuentemente, implementa un sistema de caché para reducir llamadas a la IA.

2. **Procesamiento por Lotes**: Agrupa múltiples solicitudes relacionadas en una sola llamada a la IA cuando sea posible.

3. **Validación**: Siempre valida la respuesta de la IA antes de utilizarla en sistemas críticos.

4. **Supervisión Humana**: Mantén un proceso de revisión humana para respuestas que impacten decisiones importantes.

5. **Contextualización**: Proporciona siempre contexto suficiente en tus prompts para obtener respuestas más precisas.

## 🔄 Integración con CI/CD

Para automatizar completamente tu flujo de trabajo, considera integrar la API en tu pipeline de CI/CD:

```javascript
// Hook post-commit para análisis automático de código
const codeAnalysis = async (commitDiff) => {
  try {
    const prompt = `
    Analiza los siguientes cambios de código y proporciona:
    1. Resumen de cambios
    2. Posibles problemas o bugs
    3. Sugerencias de mejora
    
    Cambios:
    ${commitDiff}
    `;
    
    // Resto de la implementación...
  } catch (error) {
    console.error('Error en análisis de código:', error);
  }
};
```

## 📚 Siguiente paso

Explora nuestra [documentación técnica para desarrolladores](/docs/developer/) para aprender sobre la arquitectura interna y cómo extender las capacidades de la API.
