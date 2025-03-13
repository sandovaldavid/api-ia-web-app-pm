# 💬 Guía del Sistema de Chat

Esta guía explica cómo utilizar el sistema de chat con IA para obtener respuestas y sugerencias en el contexto de tus proyectos.

## 📋 Visión general

El sistema de chat permite una interacción conversacional con la IA, contextualizando las preguntas y respuestas según la tarea o proyecto relacionado. Los principales componentes son:

1. Chats - Representan una conversación completa
2. Mensajes - Cada pregunta (prompt) y respuesta dentro de un chat

## 🆕 Crear un nuevo chat

Para crear un nuevo chat, envía una solicitud POST a `/api/chats` con los siguientes datos:

```json
{
  "title": "Consulta sobre API REST",
  "taskId": "123",  // Opcional - ID de una tarea relacionada
  "projectId": "456" // Opcional - ID de un proyecto relacionado
}
```

Ejemplo con cURL:

```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Consulta sobre API REST",
    "taskId": "123"
  }'
```

Si la creación es exitosa, recibirás una respuesta como esta:

```json
{
  "success": true,
  "data": {
    "_id": "60f3e5c87b9b78001d8e4a2c",
    "title": "Consulta sobre API REST",
    "user": "6095d12f583e4f001c7f4b5d",
    "taskId": "123",
    "status": "active",
    "lastMessage": "2023-07-18T15:45:28.651Z",
    "createdAt": "2023-07-18T15:45:28.651Z",
    "updatedAt": "2023-07-18T15:45:28.651Z"
  }
}
```

## 📝 Enviar un mensaje

Una vez que tienes un chat, puedes enviar mensajes a la IA. Para ello, envía una solicitud POST a `/api/chats/:chatId/messages` con los siguientes datos:

```json
{
  "prompt": "¿Cómo implemento autenticación JWT en Node.js?",
  "requestType": "user_message" // Opcional - Valor predeterminado
}
```

Ejemplo con cURL:

```bash
curl -X POST http://localhost:3000/api/chats/60f3e5c87b9b78001d8e4a2c/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "prompt": "¿Cómo implemento autenticación JWT en Node.js?"
  }'
```

La respuesta incluirá tanto tu mensaje como la respuesta generada por la IA:

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "60f3e6d87b9b78001d8e4a2d",
      "user": "6095d12f583e4f001c7f4b5d",
      "chat": "60f3e5c87b9b78001d8e4a2c",
      "requestType": "user_message",
      "prompt": "¿Cómo implemento autenticación JWT en Node.js?",
      "response": {
        "content": "¿Cómo implemento autenticación JWT en Node.js?"
      },
      "taskId": "123",
      "createdAt": "2023-07-18T15:46:48.651Z"
    },
    "aiMessage": {
      "_id": "60f3e6d87b9b78001d8e4a2e",
      "user": "6095d12f583e4f001c7f4b5d",
      "chat": "60f3e5c87b9b78001d8e4a2c",
      "requestType": "ai_response",
      "prompt": "¿Cómo implemento autenticación JWT en Node.js?",
      "response": {
        "content": "Para implementar autenticación JWT en Node.js, sigue estos pasos:\n\n1. Instala las dependencias necesarias:\n```bash\nnpm install jsonwebtoken express\n```\n\n2. Configura JWT:\n```javascript\nconst jwt = require('jsonwebtoken');\nconst SECRET_KEY = 'tu_clave_secreta';\n\n// Generar token\nconst token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });\n\n// Verificar token (middleware)\nfunction verifyToken(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  \n  if (!token) {\n    return res.status(401).json({ message: 'Token no proporcionado' });\n  }\n  \n  try {\n    const decoded = jwt.verify(token, SECRET_KEY);\n    req.user = decoded;\n    next();\n  } catch (error) {\n    return res.status(401).json({ message: 'Token inválido' });\n  }\n}\n```\n\n3. Implementa las rutas:\n```javascript\napp.post('/login', (req, res) => {\n  // Verificar credenciales\n  const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });\n  res.json({ token });\n});\n\napp.get('/ruta-protegida', verifyToken, (req, res) => {\n  // Solo accesible con token válido\n  res.json({ data: 'Información protegida' });\n});\n```\n\nRecuerda almacenar tu SECRET_KEY en variables de entorno para mayor seguridad."
      },
      "taskId": "123",
      "createdAt": "2023-07-18T15:46:48.899Z"
    }
  }
}
```

## 📋 Listar mensajes de un chat

Para obtener todos los mensajes de un chat específico, envía una solicitud GET a `/api/chats/:chatId/messages`:

```bash
curl -X GET http://localhost:3000/api/chats/60f3e5c87b9b78001d8e4a2c/messages \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

La respuesta incluirá todos los mensajes ordenados cronológicamente:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60f3e6d87b9b78001d8e4a2d",
      "user": "6095d12f583e4f001c7f4b5d",
      "chat": "60f3e5c87b9b78001d8e4a2c",
      "requestType": "user_message",
      "prompt": "¿Cómo implemento autenticación JWT en Node.js?",
      "response": {
        "content": "¿Cómo implemento autenticación JWT en Node.js?"
      },
      "taskId": "123",
      "createdAt": "2023-07-18T15:46:48.651Z"
    },
    {
      "_id": "60f3e6d87b9b78001d8e4a2e",
      "user": "6095d12f583e4f001c7f4b5d",
      "chat": "60f3e5c87b9b78001d8e4a2c",
      "requestType": "ai_response",
      "prompt": "¿Cómo implemento autenticación JWT en Node.js?",
      "response": {
        "content": "Para implementar autenticación JWT en Node.js, sigue estos pasos:..."
      },
      "taskId": "123",
      "createdAt": "2023-07-18T15:46:48.899Z"
    }
  ]
}
```

## 📂 Gestionar chats

### Listar todos los chats

Para obtener todos tus chats, envía una solicitud GET a `/api/chats`:

```bash
curl -X GET http://localhost:3000/api/chats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Puedes filtrar por estado añadiendo un parámetro de consulta:

```bash
curl -X GET "http://localhost:3000/api/chats?status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Archivar un chat

Para archivar un chat, envía una solicitud PATCH a `/api/chats/:id/archive`:

```bash
curl -X PATCH http://localhost:3000/api/chats/60f3e5c87b9b78001d8e4a2c/archive \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Eliminar un chat

Para eliminar un chat y todos sus mensajes, envía una solicitud DELETE a `/api/chats/:id`:

```bash
curl -X DELETE http://localhost:3000/api/chats/60f3e5c87b9b78001d8e4a2c \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧠 Tipos de mensajes especiales

Además de los mensajes normales, puedes enviar mensajes con tipos específicos para diferentes propósitos:

### Solicitud de código

```json
{
  "prompt": "Necesito una función para validar emails en JavaScript",
  "requestType": "code_suggestion"
}
```

### Relacionados con tareas

```json
{
  "prompt": "¿Cuál es la mejor manera de implementar esta tarea?",
  "requestType": "task_parameterization",
  "taskId": "123"
}
```

### Relacionados con proyectos

```json
{
  "prompt": "¿Cómo deberíamos estructurar el equipo para este proyecto?",
  "requestType": "project_context",
  "projectId": "456"
}
```

## 📱 Implementación en el cliente

### Ejemplo con React

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ChatComponent({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Cargar mensajes existentes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/chats/${chatId}/messages`);
        setMessages(response.data.data);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      }
    };
    
    fetchMessages();
  }, [chatId]);
  
  // Enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`/api/chats/${chatId}/messages`, { prompt });
      // Añadir mensaje del usuario y respuesta de la IA
      setMessages(prevMessages => [...prevMessages, 
        response.data.data.userMessage, 
        response.data.data.aiMessage
      ]);
      setPrompt('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al comunicarse con la IA');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="chat-container">
      <div className="messages-list">
        {messages.map(message => (
          <div 
            key={message._id} 
            className={`message ${message.requestType === 'ai_response' ? 'ai' : 'user'}`}
          >
            {message.requestType === 'ai_response' ? (
              <div dangerouslySetInnerHTML={{ __html: message.response.content }} />
            ) : (
              <p>{message.prompt}</p>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={sendMessage}>
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !prompt.trim()}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}

export default ChatComponent;
```

## 📚 Siguiente paso

Ahora que sabes cómo utilizar el sistema de chat, puedes explorar la [parametrización de tareas](./task-parameterization.html) para automatizar la estimación y clasificación de tareas en tus proyectos.
