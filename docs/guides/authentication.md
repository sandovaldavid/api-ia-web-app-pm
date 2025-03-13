# 🔐 Autenticación y Autorización

Esta guía explica cómo implementar la autenticación y autorización en tu aplicación cliente para interactuar de manera segura con la API Intermediaria IA.

## 📋 Visión General

La API Intermediaria utiliza JSON Web Tokens (JWT) para la autenticación. El proceso general es:

1. El usuario se registra o inicia sesión
2. El servidor valida las credenciales y devuelve un token JWT
3. El cliente almacena este token
4. El cliente envía el token en cada solicitud posterior en el header `Authorization`
5. El servidor valida el token y procesa la solicitud si es válido

## 🔑 Endpoints de Autenticación

### Registro de Usuario

```http
POST /api/users/register
Content-Type: application/json

{
  "name": "Nombre Usuario",
  "email": "usuario@example.com",
  "password": "contraseña_segura"
}
```

Respuesta exitosa (201 Created):

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Nombre Usuario",
    "email": "usuario@example.com"
  }
}
```

### Inicio de Sesión

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña_segura"
}
```

Respuesta exitosa (200 OK):

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Nombre Usuario",
    "email": "usuario@example.com"
  }
}
```

### Obtener Perfil de Usuario

```http
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Respuesta exitosa (200 OK):

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Nombre Usuario",
    "email": "usuario@example.com"
  }
}
```

## 🔒 Uso del Token JWT

Una vez que hayas obtenido un token JWT mediante el registro o inicio de sesión, debes incluirlo en todas las solicitudes a rutas protegidas.

### Formato del Header de Autorización

```http
Authorization: Bearer {tu_token_jwt}
```

### Ejemplo con cURL

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 👤 Obtener información del usuario actual

Para verificar que la autenticación funciona y obtener información del usuario autenticado, puedes hacer una solicitud a `/api/users/me`:

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Si el token es válido, recibirás una respuesta como esta:

```json
{
  "success": true,
  "data": {
    "_id": "61234567890abcdef1234567",
    "name": "Nombre Usuario",
    "email": "usuario@example.com",
    "role": "user",
    "createdAt": "2023-07-18T15:45:28.651Z"
  }
}
```

## ⚠️ Manejo de errores

Si el token no es válido o ha expirado, recibirás un error 401 (No autorizado):

```json
{
  "success": false,
  "error": "No autorizado para acceder a esta ruta"
}
```

Si intentas acceder a un recurso sin los permisos necesarios, recibirás un error 403 (Prohibido).

## 📚 Implementación en el cliente

### En JavaScript (Axios)

```javascript
// Configuración global
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// O en una solicitud específica
axios.get('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### En React (con context API)

```jsx
// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // Cargar información del usuario
      axios.get('/api/users/me')
        .then(res => setUser(res.data.data))
        .catch(err => {
          console.error('Error al cargar usuario:', err);
          logout();
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);
  
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/users/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };
  
  const logout = () => {
    setToken(null);
  };
  
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## 📚 Siguiente paso

Ahora que sabes cómo autenticarte, puedes consultar nuestra [guía del sistema de chat](./chat-system.html) para aprender a interactuar con la IA.
