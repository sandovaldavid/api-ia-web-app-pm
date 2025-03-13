# 📊 Guía de Parametrización de Tareas con IA

Esta guía explica cómo utilizar la API para parametrizar tareas de proyectos utilizando inteligencia artificial.

## 📋 Visión General

La parametrización de tareas utiliza IA para analizar una tarea y determinar automáticamente:

- Tipo de tarea (Frontend, Backend, etc.)
- Palabras clave relacionadas
- Nivel de complejidad (Baja, Media, Alta)
- Tiempo estimado para completarla

Esta funcionalidad permite estandarizar la información de las tareas y proporciona datos valiosos para la planificación de proyectos.

## 🚀 Parametrizar una Tarea

Para parametrizar una tarea, envía una solicitud GET a `/api/tasks/:taskId/parameterize`. La API obtendrá la información de la tarea desde Django, la analizará con IA y devolverá los parámetros.

### Ejemplo de solicitud:

```bash
curl -X GET http://localhost:3000/api/tasks/123/parameterize \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Ejemplo de respuesta:

```json
{
  "success": true,
  "data": {
    "tarea": "Implementar sistema de autenticación",
    "tipo": "Desarrollo Backend",
    "palabras_clave": ["JWT", "Autenticación", "API REST", "Seguridad"],
    "complejidad": "Media",
    "tiempo_estimado": "5 días"
  }
}
```

## 📄 Estructura de los Parámetros

La respuesta incluye los siguientes campos:

- **tarea**: Nombre o título identificativo de la tarea
- **tipo**: Categoría de la tarea (Frontend, Backend, Documentación, Testing, etc.)
- **palabras_clave**: Array de términos relevantes para la tarea
- **complejidad**: Nivel de dificultad estimado (Baja, Media, Alta)
- **tiempo_estimado**: Estimación del tiempo necesario para completar la tarea

## 🔄 Flujo de Trabajo Interno

Cuando parametrizas una tarea, ocurre el siguiente proceso:

1. La API obtiene los detalles de la tarea desde Django
2. Formatea la información en un prompt estructurado
3. Envía el prompt a Ollama con el modelo DeepSeek
4. La IA analiza la tarea y genera parámetros
5. La API procesa la respuesta y extrae los parámetros relevantes
6. Los parámetros son devueltos al cliente y también almacenados en MongoDB

## 🔍 Casos de Uso

### Planificación de Sprints

Utiliza los parámetros generados para estimar la duración total de un sprint y distribuir equitativamente la carga de trabajo.

```javascript
// Ejemplo de cálculo de tiempo total para un sprint
async function calcularTiempoSprint(taskIds) {
  let tiempoTotal = 0;
  
  for (const taskId of taskIds) {
    const response = await axios.get(`/api/tasks/${taskId}/parameterize`);
    const tiempoEstimado = response.data.data.tiempo_estimado;
    
    // Convertir a días (asumiendo formato "X días")
    const dias = parseInt(tiempoEstimado.split(' ')[0]);
    tiempoTotal += dias;
  }
  
  return `${tiempoTotal} días`;
}
```

### Asignación Inteligente

Combina la parametrización con la asignación de recursos para encontrar el mejor match entre tareas y desarrolladores.

```javascript
async function asignarRecursoOptimo(taskId) {
  // Primero parametrizar la tarea
  const parametros = await axios.get(`/api/tasks/${taskId}/parameterize`);
  
  // Luego obtener asignación de recurso basada en los parámetros
  const asignacion = await axios.get(`/api/resources/assign/${taskId}`);
  
  return asignacion.data.data;
}
```

## 💡 Mejores Prácticas

### Descripciones Detalladas

Para obtener los mejores resultados, asegúrate de que las tareas en Django tengan:

- Títulos claros y descriptivos
- Descripciones detalladas que expliquen el objetivo y contexto
- Relación con un proyecto específico

### Verificación y Ajuste

Aunque la IA proporciona buenas estimaciones, siempre es recomendable:

1. Revisar los parámetros generados
2. Ajustar manualmente si es necesario
3. Retroalimentar al sistema con datos reales una vez completada la tarea

## 📱 Implementación en el Cliente

### Ejemplo con React

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function TaskParametrization({ taskId }) {
  const [parameters, setParameters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const parametrizeTask = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/tasks/${taskId}/parameterize`);
      setParameters(response.data.data);
    } catch (err) {
      setError('Error al parametrizar la tarea: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="task-parametrization">
      <h2>Parametrización de Tarea</h2>
      
      <button 
        onClick={parametrizeTask} 
        disabled={loading}
        className="parametrize-button"
      >
        {loading ? 'Parametrizando...' : 'Parametrizar Tarea'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {parameters && (
        <div className="parameters-card">
          <h3>{parameters.tarea}</h3>
          
          <div className="parameter">
            <span className="label">Tipo:</span>
            <span className="value">{parameters.tipo}</span>
          </div>
          
          <div className="parameter">
            <span className="label">Complejidad:</span>
            <span className="value badge">{parameters.complejidad}</span>
          </div>
          
          <div className="parameter">
            <span className="label">Tiempo estimado:</span>
            <span className="value">{parameters.tiempo_estimado}</span>
          </div>
          
          <div className="parameter">
            <span className="label">Palabras clave:</span>
            <div className="tags">
              {parameters.palabras_clave.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskParametrization;
```

## 📚 Siguiente paso

Ahora que has aprendido a parametrizar tareas, puedes avanzar a [asignación de recursos](./resource-assignment.html) para maximizar la eficiencia de tu equipo utilizando IA.
