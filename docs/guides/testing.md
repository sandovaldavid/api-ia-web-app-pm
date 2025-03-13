# 🧪 Guía de Testing

Esta guía explica cómo realizar pruebas en la API Intermediaria IA para garantizar su correcto funcionamiento.

## 📋 Visión General

La API implementa diferentes tipos de pruebas:

1. **Pruebas Unitarias**: Verifican el funcionamiento de componentes individuales
2. **Pruebas de Integración**: Comprueban la interacción entre componentes
3. **Pruebas de API**: Validan el funcionamiento de los endpoints
4. **Pruebas de Rendimiento**: Evalúan el comportamiento bajo carga

## 🛠️ Configuración

### Requisitos previos

- Node.js v14 o superior
- MongoDB (para pruebas de integración)
- Instancia de prueba de Django API (o mocks)
- Instancia de prueba de Ollama (o mocks)

### Configuración del entorno de prueba

Crea un archivo `.env.test` con configuración específica para pruebas:

```properties
PORT=3001
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/api-intermediaria-test
JWT_SECRET=test_secret_key
DJANGO_API_URL=http://localhost:8001/api
DJANGO_API_TOKEN=test_token
OLLAMA_API_URL=http://localhost:11434/api
OLLAMA_MODEL=deepseek-coder
```

## ▶️ Ejecución de Pruebas

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar pruebas específicas

```bash
# Pruebas unitarias
npm run test:unit

# Pruebas de integración
npm run test:integration

# Pruebas de API
npm run test:api

# Pruebas de un archivo específico
npm test -- --testPathPattern=user.controller.test.js
```

### Ejecutar pruebas con cobertura

```bash
npm run test:coverage
```

## 📝 Escritura de Pruebas

### Pruebas Unitarias

Las pruebas unitarias se encuentran en el directorio `tests/unit` y se centran en componentes aislados.

Ejemplo de prueba unitaria para una función de helper:

```javascript
// tests/unit/utils/helpers.test.js
const { formatTaskPrompt } = require('../../../src/utils/helpers');

describe('formatTaskPrompt', () => {
  it('should format task prompt correctly', () => {
    const task = {
      title: 'Implementar autenticación',
      description: 'Crear sistema de login con JWT',
      status: 'pending',
      priority: 'high'
    };
    
    const prompt = formatTaskPrompt(task);
    
    expect(prompt).toContain('Implementar autenticación');
    expect(prompt).toContain('Crear sistema de login con JWT');
    expect(prompt).toContain('high');
  });
  
  it('should handle missing fields', () => {
    const task = {
      title: 'Implementar autenticación'
    };
    
    const prompt = formatTaskPrompt(task);
    
    expect(prompt).toContain('Implementar autenticación');
    expect(prompt).not.toBeUndefined();
  });
});
```

### Pruebas de Integración

Las pruebas de integración se encuentran en el directorio `tests/integration` y prueban la interacción entre varios componentes.

Ejemplo de prueba de integración para la funcionalidad de chat:

```javascript
// tests/integration/chat.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const Chat = require('../../src/models/Chat');
const User = require('../../src/models/User');
const { generateToken } = require('../helpers/auth');

let token;
let userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Crear usuario de prueba
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  userId = user._id;
  token = generateToken(user);
});

afterAll(async () => {
  await User.deleteMany();
  await Chat.deleteMany();
  await mongoose.connection.close();
});

describe('Chat API', () => {
  it('should create a new chat', async () => {
    const res = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Chat'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Chat');
  });
  
  it('should return user chats', async () => {
    await Chat.create({
      title: 'Another Chat',
      user: userId
    });
    
    const res = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
```

### Pruebas de API (End-to-End)

Las pruebas de API se encuentran en el directorio `tests/api` y validan el funcionamiento completo de los endpoints.

```javascript
// tests/api/task.api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { generateToken } = require('../helpers/auth');
const User = require('../../src/models/User');
const nock = require('nock'); // Para mockear APIs externas

let token;
let userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Crear usuario de prueba
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  userId = user._id;
  token = generateToken(user);
  
  // Mockear la API de Django
  nock(process.env.DJANGO_API_URL)
    .get('/tasks/123')
    .reply(200, {
      id: '123',
      title: 'Test Task',
      description: 'Task description',
      status: 'pending'
    });
  
  // Mockear la API de Ollama
  nock(process.env.OLLAMA_API_URL)
    .post('/generate')
    .reply(200, {
      response: JSON.stringify({
        tarea: 'Test Task',
        tipo: 'Testing',
        palabras_clave: ['test', 'jest'],
        complejidad: 'Baja',
        tiempo_estimado: '1 día'
      })
    });
});

afterAll(async () => {
  await User.deleteMany();
  await mongoose.connection.close();
  nock.cleanAll();
});

describe('Task API Endpoints', () => {
  it('should parameterize a task', async () => {
    const res = await request(app)
      .get('/api/tasks/123/parameterize')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tarea).toBe('Test Task');
    expect(res.body.data.tipo).toBe('Testing');
  });
});
```

### Mocks y Stubs

Para pruebas que dependen de servicios externos (Django, Ollama), utilizamos:

1. **nock**: Para mockear respuestas HTTP
2. **sinon**: Para crear stubs y spies
3. **mock-mongoose**: Para simular operaciones de MongoDB

Ejemplo de configuración de mocks:

```javascript
// tests/setup/mocks.js
const nock = require('nock');
const config = require('../../src/config/env');

// Configurar mocks básicos para servicios externos
function setupMocks() {
  // Mock para Django API
  nock(config.djangoApiUrl)
    .persist()
    .get(/\/tasks\/\d+/)
    .reply(200, {
      id: '123',
      title: 'Mocked Task',
      description: 'This is a mocked task',
      status: 'pending'
    });
  
  // Mock para Ollama API
  nock(config.ollamaApiUrl)
    .persist()
    .post('/generate')
    .reply(200, {
      response: 'Mocked AI response'
    });
}

function cleanupMocks() {
  nock.cleanAll();
}

module.exports = {
  setupMocks,
  cleanupMocks
};
```

## 📊 Cobertura de Código

Utilizamos Jest para generar informes de cobertura de código:

```bash
npm run test:coverage
```

Esto generará un informe detallado en `coverage/lcov-report/index.html`.

Objetivos de cobertura:
- Líneas: > 80%
- Funciones: > 90%
- Ramas: > 75%
- Statements: > 80%

## 🔍 Pruebas de Rendimiento

Para pruebas de rendimiento utilizamos k6:

```bash
# Instalar k6
npm install -g k6

# Ejecutar prueba de rendimiento
k6 run tests/performance/api-load-test.js
```

Ejemplo de script de prueba de rendimiento:

```javascript
// tests/performance/api-load-test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

export function setup() {
  // Obtener token para pruebas
  const loginRes = http.post('http://localhost:3000/api/users/login', {
    email: 'load@test.com',
    password: 'password123',
  });
  
  const authToken = JSON.parse(loginRes.body).token;
  return { authToken };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };
  
  // Probar endpoint de chats
  const chatsRes = http.get('http://localhost:3000/api/chats', { headers });
  check(chatsRes, {
    'status is 200': (r) => r.status === 200,
    'has chats array': (r) => JSON.parse(r.body).data !== undefined,
  });
  
  sleep(1);
}
```

## 🔄 Integración Continua

Las pruebas se ejecutan automáticamente en cada push y pull request mediante GitHub Actions.

Configuración en `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main, development ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '14'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Upload coverage report
      uses: codecov/codecov-action@v3
```

## 🚀 Mejores Prácticas

1. **Aislamiento**: Cada prueba debe ser independiente y no afectar a otras pruebas
2. **Datos de prueba**: Utilizar datos de prueba específicos y no datos reales
3. **Mocking**: Mockear servicios externos para pruebas consistentes
4. **Limpieza**: Limpiar recursos después de cada prueba
5. **Cobertura**: Asegurar una buena cobertura de código con casos de prueba diversos
6. **CI/CD**: Integrar pruebas en tu pipeline de CI/CD para detección temprana de problemas
