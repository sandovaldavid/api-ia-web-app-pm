# 🤖 API Intermediaria IA

API Intermediaria para la gestión de tareas y proyectos con integración de IA local.

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/sandovaldavid/api-ia-web-app-pm/ci.yml?branch=main)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Descripción

Este proyecto implementa una API RESTful que actúa como intermediario entre una aplicación de gestión de proyectos basada en Django y modelos de IA local mediante Ollama. Proporciona funcionalidades de:

- Parametrización automática de tareas usando IA
- Asignación inteligente de recursos humanos
- Sistema de chat con IA como asistente de proyectos
- Análisis y recomendaciones basadas en datos del proyecto

La API utiliza MongoDB para almacenar datos de usuarios, chats y mensajes, mientras consume datos de proyectos y tareas desde una API Django externa.

## 🚀 Características Principales

- **Sistema de Autenticación**: JWT para la gestión segura de usuarios
- **Integración con IA Local**: Comunicación con Ollama para inferencia con modelos locales
- **Chat con IA**: Interfaz para conversaciones con modelo DeepSeek Coder
- **Paramétrización de Tareas**: Análisis automático de requisitos y especificaciones
- **Asignación de Recursos**: Sugerencia inteligente de asignaciones según habilidades
- **Documentación Completa**: Swagger/OpenAPI y guías detalladas
- **Monitoreo**: Sistema integrado de monitoreo y diagnóstico

## 🛠️ Tecnologías

- **Backend**: Node.js, Express
- **Base de Datos**: MongoDB con Mongoose
- **IA Local**: Ollama (DeepSeek Coder)
- **Autenticación**: JWT
- **Validación**: Joi
- **Logging**: Winston
- **Documentación**: OpenAPI/Swagger
- **Testing**: Jest, Supertest

## 🧰 Requisitos

- Node.js 14+
- MongoDB 5+
- Ollama con modelo DeepSeek Coder instalado
- API Django accesible

## ⚙️ Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/sandovaldavid/api-ia-web-app-pm.git
   cd api-ia-web-app-pm
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   # Editar .env con los valores correspondientes
   ```

4. **Ejecutar la aplicación**

   ```bash
   # Modo desarrollo
   npm run dev
   
   # Modo producción
   npm start
   ```

5. **Verificar configuración**

   ```bash
   node tools/check-config.js
   ```

## 🛠️ Scripts Disponibles

El proyecto incluye los siguientes scripts para facilitar el desarrollo y mantenimiento:

- **Ejecución**
  ```bash
  npm start             # Inicia el servidor en modo producción
  npm run dev           # Inicia servidor con hot-reload usando nodemon
  ```

- **Código y Estilo**
  ```bash
  npm run lint          # Ejecuta ESLint para verificar estilo de código
  npm run lint:fix      # Corrige automáticamente problemas de estilo
  npm run format        # Aplica Prettier a todos los archivos
  ```

- **Base de Datos**
  ```bash
  npm run migrate       # Ejecuta migraciones de base de datos
  ```

- **Utilidades y Verificación**
  ```bash
  npm run check-config  # Verifica la configuración del sistema
  npm run api-test      # Ejecuta pruebas sobre la API
  ```

- **Documentación**
  ```bash
  npm run docs:generate        # Genera documentación de la API
  npm run docs:generate-guide  # Genera guías para desarrolladores
  ```

## 📊 Endpoints Principales

- **Autenticación**: `/api/users/login`, `/api/users/register`
- **Chat**: `/api/chats`, `/api/chats/:id/messages`
- **Parametrización**: `/api/tasks/:id/parameterize`
- **Recursos**: `/api/resources/assign/:taskId`
- **Salud**: `/api/health`, `/api/health/detailed`
- **Monitoreo**: `/api/monitor/basic`, `/api/monitor/detailed`

## 📝 Documentación

La documentación completa está disponible en:

- **API Documentation**: `/docs/api`
- **Developer Guide**: `/docs/developer`
- **Integration Guide**: `/docs/guides/integration.html`
- **Deployment Guide**: `/docs/guides/deployment.html`

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas específicas
npm run test:unit
npm run test:integration
npm run test:api

# Verificar cobertura
npm run test:coverage
```

## 👥 Contribuir

Lee la [guía de contribución](CONTRIBUTING.md) para detalles sobre cómo contribuir al proyecto.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
