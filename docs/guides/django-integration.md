# 🧩 Guía de Integración con Django

Esta guía explica cómo integrar la API Intermediaria IA con tu aplicación Django existente para proporcionar funcionalidades de IA.

## 📋 Visión General

La API Intermediaria está diseñada para trabajar junto con una aplicación Django que gestiona proyectos, tareas y recursos. Para una integración exitosa, tu aplicación Django debe:

1. Exponer endpoints REST para proyectos, tareas y recursos
2. Proporcionar autenticación mediante tokens
3. Seguir una estructura de datos compatible

## 🔌 Configuración en Django

### Requisitos previos

- Django 3.2+
- Django REST Framework 3.12+
- Autenticación por tokens configurada

### Endpoints necesarios

La API Intermediaria espera los siguientes endpoints en tu aplicación Django:

| Endpoint | Método | Descripción |
|---------|--------|-------------|
| `/api/tasks/{id}/` | GET | Obtener detalles de una tarea |
| `/api/projects/{id}/` | GET | Obtener detalles de un proyecto |
| `/api/projects/{id}/tasks/` | GET | Obtener tareas de un proyecto |
| `/api/resources/` | GET | Obtener lista de recursos disponibles |

### Estructura de datos

#### Tarea (Task)

```json
{
  "id": "123",
  "title": "Implementar autenticación",
  "description": "Crear sistema de autenticación con JWT",
  "project": {
    "id": "456",
    "name": "API REST"
  },
  "status": "pending",
  "priority": "high",
  "created_at": "2023-07-18T15:45:28.651Z"
}
```

#### Recurso (Resource)

```json
{
  "id": "789",
  "name": "Ana García",
  "role": "Backend Developer",
  "technologies": ["Node.js", "Express", "MongoDB"],
  "experience": "Senior",
  "availability": 0.8
}
```

## 🔒 Configuración de Autenticación

### Generación de tokens de API

Necesitas generar un token de API en tu aplicación Django para que la API Intermediaria pueda acceder a tus datos:

```python
# En tu aplicación Django
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

user = User.objects.get(username='api_user')
token, created = Token.objects.get_or_create(user=user)
print(token.key)  # Este es el token que debes usar en .env
```

### Configuración del token en la API Intermediaria

Una vez que tengas tu token, añádelo al archivo `.env` de la API Intermediaria:

```properties
DJANGO_API_URL=https://tu-aplicacion-django.com/api
DJANGO_API_TOKEN=tu_token_generado
```

## 🚀 Implementación en Django

### Modificar Views para incluir información adicional

Es recomendable que tus views de Django incluyan datos contextuales suficientes para que la IA pueda hacer buenos análisis:

```python
# tasks/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    task = Task.objects.get(pk=task_id)
    
    # Incluir datos de contexto enriquecido
    serialized_task = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "project": {
            "id": task.project.id,
            "name": task.project.name,
            "description": task.project.description
        },
        "requirements": task.requirements,
        "priority": task.priority,
        "status": task.status,
        "related_tasks": [
            {"id": rt.id, "title": rt.title} for rt in task.related_tasks.all()
        ],
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }
    
    return Response(serialized_task)
```

## 🔄 Flujo de Datos

El flujo de integración entre Django y la API Intermediaria funciona así:

1. El cliente web realiza una petición a la API Intermediaria
2. La API Intermediaria autentica al usuario con JWT
3. La API Intermediaria solicita datos a Django usando el token de API
4. Django responde con los datos solicitados
5. La API Intermediaria procesa los datos con Ollama (IA)
6. El resultado se almacena en MongoDB y se devuelve al cliente

## 📊 Visualización de resultados en Django

Para visualizar los resultados de la IA en tu aplicación Django, puedes implementar endpoints que consulten a la API Intermediaria:

```python
# En tu aplicación Django
import requests

@api_view(['GET'])
def task_with_ai_parameters(request, task_id):
    # Obtener los datos básicos de la tarea
    task = Task.objects.get(pk=task_id)
    serialized_task = TaskSerializer(task).data
    
    # Obtener parámetros de IA desde la API Intermediaria
    headers = {'Authorization': f'Bearer {request.user.api_token}'}
    ai_response = requests.get(
        f'http://api-intermediaria.com/api/tasks/{task_id}/parameterize',
        headers=headers
    )
    
    if ai_response.status_code == 200:
        # Combinar datos
        serialized_task['ai_parameters'] = ai_response.json()['data']
    
    return Response(serialized_task)
```

## 🛠️ Mejores Prácticas

### Seguridad

- Utiliza HTTPS para todas las comunicaciones
- No compartas tokens de API en repositorios públicos
- Limita los permisos del usuario de API en Django
- Rota el token periodicamente

### Rendimiento

- Implementa caché para reducir llamadas repetitivas
- Considera webhooks para notificaciones de cambios
- Utiliza tareas asíncronas para operaciones largas

## 📚 Siguiente paso

Ahora que has integrado tu aplicación Django con la API Intermediaria, puedes comenzar a utilizar las guías específicas de cada funcionalidad:

- [Parametrización de Tareas](./task-parameterization.html)
- [Asignación de Recursos](./resource-assignment.html)
- [Sistema de Chat con IA](./chat-system.html)
