# 👥 Guía de Asignación de Recursos con IA

Esta guía explica cómo utilizar la API para asignar eficientemente recursos humanos a tareas y proyectos utilizando inteligencia artificial.

## 📋 Visión General

La asignación de recursos mediante IA analiza las tareas y los perfiles de los desarrolladores disponibles para recomendar la mejor combinación posible, considerando:

- Habilidades técnicas requeridas por la tarea
- Experiencia del desarrollador
- Nivel del desarrollador (Junior, Mid, Senior)
- Tecnologías dominadas
- Disponibilidad

## 🚀 Asignar Recursos a una Tarea

Para obtener una recomendación de asignación para una tarea específica, envía una solicitud GET a `/api/resources/assign/:taskId`:

### Ejemplo de solicitud:

```bash
curl -X GET http://localhost:3000/api/resources/assign/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Ejemplo de respuesta:

```json
{
  "success": true,
  "data": {
    "tarea": "Implementar autenticación OAuth",
    "recurso_asignado": {
      "desarrollador": "Ana García",
      "nivel": "Senior",
      "tecnología": "Node.js",
      "herramientas": ["Express", "JWT", "OAuth2", "MongoDB"]
    }
  }
}
```

## 🚀 Asignar Recursos a un Proyecto Completo

Para asignar recursos a todas las tareas de un proyecto, envía una solicitud GET a `/api/resources/assign/project/:projectId`:

### Ejemplo de solicitud:

```bash
curl -X GET http://localhost:3000/api/resources/assign/project/456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Ejemplo de respuesta:

```json
{
  "success": true,
  "data": {
    "proyecto": "Sistema de Gestión de Ventas",
    "equipo_sugerido": ["Ana García", "Carlos López", "Elena Martínez", "David Rodríguez"],
    "tareas_asignadas": {
      "Ana García": "Implementar autenticación OAuth",
      "Carlos López": "Desarrollo de API REST para inventario",
      "Elena Martínez": "Diseño de interfaz de usuario",
      "David Rodríguez": "Configuración de base de datos"
    }
  }
}
```

## 🧠 Cómo funciona

El proceso de asignación de recursos sigue estos pasos:

1. La API obtiene los detalles de la tarea (o todas las tareas del proyecto)
2. Recupera la información de todos los recursos disponibles desde Django
3. La IA analiza las características de la tarea y las habilidades de los desarrolladores
4. Determina la mejor coincidencia considerando múltiples factores
5. Genera una recomendación de asignación

## 🌟 Beneficios

- **Objetividad**: Elimina sesgos en la asignación de tareas
- **Eficiencia**: Optimiza la productividad al asignar recursos adecuados
- **Aprendizaje**: La IA mejora sus recomendaciones con el tiempo
- **Equilibrio**: Ayuda a distribuir la carga de trabajo de manera equitativa
- **Transparencia**: Proporciona justificación para las asignaciones

## 📊 Factores considerados

La IA pondera diferentes factores para determinar la asignación óptima:

| Factor | Descripción | Peso |
|--------|-------------|------|
| **Match técnico** | Coincidencia entre habilidades y requisitos técnicos | Alto |
| **Experiencia** | Experiencia previa en tareas similares | Alto |
| **Disponibilidad** | Carga de trabajo actual del desarrollador | Medio |
| **Historial** | Desempeño histórico en tareas similares | Medio |
| **Equilibrio de equipo** | Distribución equitativa del trabajo | Bajo |

## 💻 Implementación en el cliente

### Ejemplo con React

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function ResourceAssignment({ taskId, projectId }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProjectAssignment, setIsProjectAssignment] = useState(false);
  
  const assignResources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (isProjectAssignment) {
        response = await axios.get(`/api/resources/assign/project/${projectId}`);
      } else {
        response = await axios.get(`/api/resources/assign/${taskId}`);
      }
      
      setAssignment(response.data.data);
    } catch (err) {
      setError('Error al asignar recursos: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="resource-assignment">
      <h2>Asignación de Recursos con IA</h2>
      
      <div className="toggle-container">
        <label>
          <input
            type="checkbox"
            checked={isProjectAssignment}
            onChange={() => setIsProjectAssignment(!isProjectAssignment)}
          />
          Asignar recursos al proyecto completo
        </label>
      </div>
      
      <button 
        onClick={assignResources} 
        disabled={loading || (isProjectAssignment ? !projectId : !taskId)}
        className="assign-button"
      >
        {loading ? 'Asignando...' : 'Asignar Recursos'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {assignment && !isProjectAssignment && (
        <div className="assignment-card">
          <h3>{assignment.tarea}</h3>
          
          <div className="assigned-resource">
            <h4>{assignment.recurso_asignado.desarrollador}</h4>
            <span className="badge">{assignment.recurso_asignado.nivel}</span>
            <p>Tecnología principal: {assignment.recurso_asignado.tecnología}</p>
            <div className="tools">
              <strong>Herramientas:</strong>
              <div className="tags">
                {assignment.recurso_asignado.herramientas.map((tool, i) => (
                  <span key={i} className="tag">{tool}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {assignment && isProjectAssignment && (
        <div className="project-assignment-card">
          <h3>{assignment.proyecto}</h3>
          
          <div className="team-section">
            <h4>Equipo Sugerido:</h4>
            <ul className="team-list">
              {assignment.equipo_sugerido.map((member, i) => (
                <li key={i}>{member}</li>
              ))}
            </ul>
          </div>
          
          <div className="tasks-section">
            <h4>Asignaciones:</h4>
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Desarrollador</th>
                  <th>Tarea Asignada</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(assignment.tareas_asignadas).map(([dev, task], i) => (
                  <tr key={i}>
                    <td>{dev}</td>
                    <td>{task}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceAssignment;
```

## 🛠️ Mejores Prácticas

### Mantener Perfiles Actualizados

Para obtener las mejores recomendaciones, asegúrate de:

1. Mantener actualizados los perfiles de los desarrolladores en Django
2. Incluir información detallada sobre habilidades y experiencia
3. Actualizar regularmente la disponibilidad de cada recurso

### Revisar y Ajustar

Las recomendaciones de la IA son un punto de partida, pero siempre debes:

1. Revisar las asignaciones sugeridas
2. Considerar factores personales o del equipo que la IA no conoce
3. Hacer ajustes manuales cuando sea necesario

## 📚 Siguiente paso

Ahora que has aprendido a optimizar la asignación de recursos, puedes explorar la [integración con Django](./django-integration.html) para sincronizar tus proyectos y recursos.
