const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');
const config = require('./env');
const { version } = require('../../package.json');

// Path to OpenAPI documentation
const openApiPath = path.join(config.rootDir, 'docs', 'api', 'openapi.yaml');

// Read and parse OpenAPI definition
const openApiDocument = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

// Add dynamic server info and version
openApiDocument.info.version = version;
openApiDocument.servers = [
    {
        url: `http://localhost:${config.port}/api`,
        description: 'Local Development Server',
    },
    {
        url: '/api',
        description: 'Current Environment',
    },
];

/**
 * Configure Swagger middleware for Express
 * @param {Object} app - Express app instance
 */
const setupSwagger = (app) => {
    // Serve Swagger UI
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(openApiDocument, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'API Intermediaria - Documentación API',
            customfavIcon: '/docs/assets/favicon.ico',
        })
    );

    // Serve raw OpenAPI JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(openApiDocument);
    });

    // Serve raw OpenAPI YAML
    app.get('/api-docs.yaml', (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.send(fs.readFileSync(openApiPath, 'utf8'));
    });
};

module.exports = {
    setupSwagger,
    openApiDocument,
};
