# 🚀 Guía de Despliegue en Producción

Esta guía explica cómo desplegar la API Intermediaria IA en un entorno de producción de manera segura y optimizada.

## 📋 Requisitos

- Servidor Linux (Ubuntu 20.04 LTS recomendado)
- Node.js 14+ y npm
- MongoDB 5+ (puede ser una instancia local o un servicio en la nube como MongoDB Atlas)
- Ollama instalado en el servidor o accesible mediante red
- Nginx (para proxy inverso)
- Certificado SSL (recomendado Let's Encrypt)
- PM2 (gestor de procesos para Node.js)

## 🛠️ Preparación del Servidor

### Actualizar el sistema e instalar dependencias

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git nginx
```

### Instalar Node.js utilizando NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install 14
nvm use 14
nvm alias default 14
```

### Instalar PM2 globalmente

```bash
npm install -y pm2 -g
```

### Instalar y configurar MongoDB

```bash
# Importar la clave pública de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Añadir el repositorio de MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Actualizar la lista de paquetes
sudo apt-get update

# Instalar MongoDB
sudo apt-get install -y mongodb-org

# Iniciar MongoDB y habilitarlo al inicio
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Instalar y configurar Ollama

```bash
# Descargar el instalador de Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar el modelo DeepSeek Coder
ollama pull deepseek-coder
```

## 📦 Despliegue de la Aplicación

### Clonar el repositorio

```bash
cd /var/www
git clone https://github.com/sandovaldavid/api-ia-web-app-pm.git
cd api-ia-web-app-pm
```

### Instalar dependencias

```bash
npm ci --production
```

### Configurar variables de entorno

```bash
# Crear archivo .env para producción
cp .env.example .env
```

Edita el archivo `.env` con los valores de producción:

```properties
# Configuración del servidor
PORT=3000
NODE_ENV=production

# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/api-intermediaria

# JWT Secret (usar un valor fuerte generado aleatoriamente)
JWT_SECRET=valor_muy_largo_y_aleatorio_aqui
JWT_EXPIRE=30d

# API Django
DJANGO_API_URL=https://tu-django-app.com/api
DJANGO_API_TOKEN=tu_token_api_django

# API Ollama
OLLAMA_API_URL=http://localhost:11434/api
OLLAMA_MODEL=deepseek-coder
```

### Iniciar la aplicación con PM2

```bash
pm2 start src/server.js --name api-intermediaria
pm2 startup
pm2 save
```

## 🔒 Configurar Nginx como Proxy Inverso

### Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/api-intermediaria
```

Añadir la siguiente configuración:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    # Redireccionar todo el tráfico HTTP a HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.tudominio.com;

    # Configuración SSL
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Encabezados de seguridad
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Proxy inverso a la aplicación Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Documentación
    location /docs {
        root /var/www/api-ia-web-app-pm;
        try_files $uri $uri/ /docs/index.html;
    }

    # Archivos estáticos (si hay)
    location /static {
        alias /var/www/api-ia-web-app-pm/public;
        expires 7d;
    }
}
```

### Habilitar la configuración y reiniciar Nginx

```bash
sudo ln -s /etc/nginx/sites-available/api-intermediaria /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar que la configuración es correcta
sudo systemctl restart nginx
```

### Configurar Let's Encrypt con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.tudominio.com
```

## 🛡️ Seguridad Adicional

### Configurar Firewall (UFW)

```bash
sudo apt install -y ufw
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Prevenir ataques de fuerza bruta con Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Configurar límites de tasa en Nginx

Edita la configuración de Nginx y añade:

```nginx
# Limitar peticiones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ...
    location / {
        # Aplicar límite
        limit_req zone=api_limit burst=20 nodelay;
        
        # Resto de la configuración...
        proxy_pass http://localhost:3000;
        # ...
    }
    # ...
}
```

## 📊 Monitoreo

### Monitoreo básico con PM2

```bash
pm2 monit
```

### Configurar PM2 para logs rotados

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoreo avanzado (opcional)

Considera usar servicios como:
- Prometheus + Grafana
- New Relic
- Datadog

## 🔄 Actualización y Mantenimiento

### Configurar despliegue automatizado

Crea un script de despliegue:

```bash
nano /var/www/api-ia-web-app-pm/deploy.sh
```

Contenido del script:

```bash
#!/bin/bash
cd /var/www/api-ia-web-app-pm
git pull
npm ci --production
pm2 restart api-intermediaria
```

Hazlo ejecutable:

```bash
chmod +x /var/www/api-ia-web-app-pm/deploy.sh
```

### Configurar respaldos automáticos de MongoDB

Crea un script para respaldos:

```bash
nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/$TIMESTAMP
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
```

Hazlo ejecutable:

```bash
chmod +x /usr/local/bin/backup-mongodb.sh
```

Añade una tarea cron para ejecutar diariamente:

```bash
echo "0 2 * * * /usr/local/bin/backup-mongodb.sh" | sudo tee -a /etc/crontab
```

## ✅ Verificación

Asegúrate de que todo esté funcionando correctamente:

1. Verifica que la aplicación esté en funcionamiento: `pm2 status`
2. Verifica que MongoDB esté en ejecución: `systemctl status mongod`
3. Verifica que Ollama esté en ejecución: `ps aux | grep ollama`
4. Verifica la configuración de Nginx: `nginx -t`
5. Prueba que la API sea accesible: `curl -k https://api.tudominio.com/health`

## 🚨 Solución de problemas

### La API no responde

1. Verifica los logs: `pm2 logs api-intermediaria`
2. Comprueba la conexión a MongoDB: `mongo --eval "db.serverStatus()"`
3. Verifica el firewall: `ufw status`

### Problemas con Ollama

1. Reiniciar el servicio: `systemctl restart ollama`
2. Verificar logs: `journalctl -u ollama`

### Problemas de certificado SSL

1. Renovar el certificado: `sudo certbot renew`
2. Verificar la configuración: `sudo nginx -t`

## 📚 Recursos adicionales

- [Documentación de PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Buenas prácticas de seguridad para Node.js](https://expressjs.com/en/advanced/best-practice-security.html)
- [Documentación de MongoDB](https://docs.mongodb.com/)
- [Guía de seguridad de Nginx](https://www.nginx.com/blog/security-controls-nginx-part-1-basics/)
