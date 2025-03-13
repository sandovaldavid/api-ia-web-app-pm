# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a configurar y ejecutar la API Intermediaria IA en tu entorno local.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- Node.js v14 o superior
- MongoDB v5 o superior
- Ollama con el modelo DeepSeek Coder (o similar)
- Git

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/sandovaldavid/api-ia-web-app-pm.git
cd api-ia-web-app-pm
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configúralo con tus valores:

```bash
cp .env.example .env
```

Edita el archivo `.env` para configurar:

- Puerto de la API (`PORT`)
- URL de MongoDB (`MONGODB_URI`)
- Clave secreta para JWT (`JWT_SECRET`)
- URL de la API de Django (`DJANGO_API_URL`)
- Token de la API de Django (`DJANGO_API_TOKEN`)
- URL de la API de Ollama (`OLLAMA_API_URL`)
- Modelo de Ollama a utilizar (`OLLAMA_MODEL`)

### 4. Ejecutar el script de verificación de configuración

```bash
npm run check-config
```

Este script verificará que todas las dependencias y servicios necesarios estén configurados correctamente.

## 🚀 Ejecución de la API

### Modo Desarrollo

```bash
npm run dev
```

Este comando inicia el servidor con nodemon, que reiniciará automáticamente la aplicación cuando detecte cambios en los archivos.

### Modo Producción

```bash
npm start
```

## 🧪 Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas unitarias
npm run test:unit

# Ejecutar pruebas de integración
npm run test:integration

# Ejecutar pruebas de API
npm run test:api

# Generar informe de cobertura
npm run test:coverage
```

## 🛠️ Herramientas Adicionales

### Migración de Base de Datos

Para crear índices y optimizar la base de datos:

```bash
npm run migrate
```

### Prueba Rápida de API

Para verificar rápidamente que la API está funcionando:

```bash
npm run api-test
```

## 📦 Estructura del Proyecto

