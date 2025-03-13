# 🔧 Guía de Solución de Problemas

Esta guía te ayudará a diagnosticar y resolver los problemas más comunes que puedes encontrar al utilizar la API Intermediaria IA.

## 🔍 Diagnóstico General

Cuando encuentres un problema, sigue estos pasos para diagnosticarlo:

1. Verifica que todos los servicios estén en ejecución (API Intermediaria, MongoDB, Django, Ollama)
2. Comprueba los logs del servidor para identificar errores específicos
3. Confirma que las variables de entorno estén configuradas correctamente
4. Verifica que estás utilizando los tokens de autenticación correctos

## ❌ Errores Comunes y Sus Soluciones

### Errores de Conexión

#### 🔴 Error: "Failed to connect to MongoDB"

**Problema**: La API no puede conectarse a la base de datos MongoDB.

**Soluciones**:
1. Verifica que el servicio de MongoDB esté en ejecución:
   ```bash
   sudo systemctl status mongod
   ```
2. Confirma que la URL de MongoDB en el archivo `.env` es correcta
3. Comprueba que no hay firewalls bloqueando la conexión
4. Asegúrate de que las credenciales de MongoDB son correctas

#### 🔴 Error: "Failed to connect to Django API"

**Problema**: No se puede establecer conexión con la API de Django.

**Soluciones**:
1. Verifica que el servidor de Django esté en ejecución
2. Comprueba que la URL en el archivo `.env` es correcta
3. Confirma que el token de autenticación para Django es válido
4. Intenta hacer una petición directa a Django para asegurar que responde:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://tu-django-api.com/api/endpoint
   ```

#### 🔴 Error: "Failed to connect to Ollama"

**Problema**: No se puede conectar al servicio de Ollama.

**Soluciones**:
1. Verifica que Ollama esté instalado y en ejecución
2. Comprueba que la URL de Ollama en el archivo `.env` es correcta
3. Asegúrate de que el modelo DeepSeek Coder está descargado:
   ```bash
   ollama list
   ```
4. Si el modelo no está descargado, descárgalo con:
   ```bash
   ollama pull deepseek-coder
   ```

### Errores de Autenticación

#### 🔴 Error: "Invalid token" o "Token expired"

**Problema**: El token JWT proporcionado no es válido o ha expirado.

**Soluciones**:
1. Genera un nuevo token haciendo login nuevamente
2. Verifica que el token se envía correctamente en el header `Authorization: Bearer YOUR_TOKEN`
3. Asegúrate de que el reloj del servidor esté sincronizado (los tokens JWT son sensibles a diferencias de tiempo)
4. Comprueba que JWT_SECRET en el servidor no ha cambiado desde que se generó el token

#### 🔴 Error: "User not authorized"

**Problema**: El usuario no tiene permisos para acceder al recurso.

**Soluciones**:
1. Verifica que el usuario tiene los permisos necesarios
2. Comprueba que estás accediendo a recursos que pertenecen a ese usuario
3. Si es un administrador, asegúrate de que el rol esté correctamente configurado

### Errores de la IA

#### 🔴 Error: "AI model response error"

**Problema**: El modelo de IA no puede generar una respuesta adecuada.

**Soluciones**:
1. Verifica que la solicitud tiene un formato correcto
2. Comprueba que el prompt no es demasiado largo (algunos modelos tienen límites)
3. Asegúrate de que el modelo solicitado está disponible en Ollama
4. Intenta con un prompt más simple para diagnosticar si el problema es con el contenido

#### 🔴 Error: "Timeout while waiting for AI response"

**Problema**: La respuesta del modelo está tomando demasiado tiempo.

**Soluciones**:
1. Verifica que Ollama tiene suficientes recursos (CPU/GPU/RAM)
2. Reduce la complejidad o longitud del prompt
3. Comprueba si hay otros procesos consumiendo muchos recursos en el servidor
4. Considera aumentar el timeout en la configuración si los prompts son naturalmente complejos

### Errores de Validación

#### 🔴 Error: "Validation error: field X is required"

**Problema**: Falta un campo requerido en la solicitud.

**Soluciones**:
1. Revisa la documentación para ver qué campos son obligatorios
2. Comprueba que los nombres de los campos son correctos (sensibles a mayúsculas/minúsculas)
3. Verifica el formato de los datos enviados (especialmente formatos JSON)

## 📊 Monitoreo y Diagnóstico

### Verificar Estado del Servidor

Para verificar que el servidor está funcionando correctamente:

```bash
# Verificar estado de la API
curl http://localhost:3000/health

# Verificar estado detallado (requiere autenticación)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/health/detailed
```

### Verificar Logs

Los logs son una fuente valiosa de información para diagnosticar problemas:

```bash
# Si usas PM2
pm2 logs api-intermediaria

# Logs específicos
pm2 logs api-intermediaria --lines 200

# Filtrar logs por tipo de error
pm2 logs api-intermediaria | grep "MongoDB"
```

### Pruebas de Conexión

Para verificar conexiones a servicios externos:

```bash
# Verificar conexión a MongoDB
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/api-intermediaria')
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error de conexión:', err));
"

# Verificar conexión a Ollama
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "deepseek-coder",
  "prompt": "Say hello",
  "stream": false
}'
```

## 🧰 Herramientas de Diagnóstico

### Herramienta de Verificación de Configuración

La API incluye una herramienta para verificar la configuración:

```bash
# Desde el directorio del proyecto
node ./tools/check-config.js
```

Esto verificará:
- Variables de entorno configuradas correctamente
- Conexiones a servicios externos
- Permisos de archivos necesarios
- Conflictos de versiones de dependencias

### Herramienta de Pruebas de API

Para verificar que los endpoints funcionan correctamente:

```bash
# Desde el directorio del proyecto
node ./tools/api-test.js
```

## 🆘 Obtener Ayuda Adicional

Si no puedes resolver el problema con esta guía:

1. Revisa los [problemas conocidos](https://github.com/sandovaldavid/api-ia-web-app-pm/issues) en GitHub
2. Busca en las [discusiones](https://github.com/sandovaldavid/api-ia-web-app-pm/discussions) del proyecto
3. Abre un nuevo issue con los detalles del problema:
   - Descripción detallada
   - Logs relevantes
   - Pasos para reproducir
   - Entorno de ejecución

## 🔄 Reinicio del Sistema

A veces el mejor enfoque es reiniciar los componentes:

```bash
# Reiniciar MongoDB
sudo systemctl restart mongod

# Reiniciar Ollama
sudo systemctl restart ollama

# Reiniciar la API (si usas PM2)
pm2 restart api-intermediaria
```

Recuerda siempre revisar los logs después de un reinicio para verificar que no hay errores persistentes.
