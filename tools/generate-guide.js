const fs = require('fs');
const path = require('path');

// Parámetros que debería proporcionar el usuario
const guideName = process.argv[2]; // Por ejemplo: "troubleshooting"
const guideTitle = process.argv[3] || 'Nueva Guía'; // Por ejemplo: "Solución de Problemas"
const guideEmoji = process.argv[4] || '📝'; // Por ejemplo: "🔧"

if (!guideName) {
    console.error('Error: Debes proporcionar un nombre para la guía.');
    console.log('Uso: node generate-guide.js nombre-guia "Título de la Guía" "emoji"');
    process.exit(1);
}

// Rutas
const templatePath = path.join(__dirname, '../docs/guides/guide-template.html');
const outputHtmlPath = path.join(__dirname, `../docs/guides/${guideName}.html`);
const outputMdPath = path.join(__dirname, `../docs/guides/${guideName}.md`);

// Leer el template
let template = fs.readFileSync(templatePath, 'utf8');

// Reemplazar placeholders
template = template.replace('{{GUIDE_TITLE}}', guideTitle);
template = template.replace('{{MARKDOWN_PATH}}', `/docs/guides/${guideName}.md`);

// Marcar esta guía como activa en la barra lateral
template = template.replace(new RegExp(`{{#if ${guideName}}}active{{/if}}`, 'g'), 'active');

// Eliminar otros placeholders de activación
template = template.replace(/{{#if .*?}}active{{\/if}}/g, '');

// Escribir el archivo HTML
fs.writeFileSync(outputHtmlPath, template);

// Crear un archivo markdown básico si no existe
if (!fs.existsSync(outputMdPath)) {
    const mdTemplate = `# ${guideEmoji} ${guideTitle}

Esta es la guía de ${guideTitle} para la API Intermediaria IA.

## Introducción

Escribe aquí la introducción de tu guía.

## Sección 1

Contenido de la primera sección.

## Sección 2

Contenido de la segunda sección.

## Conclusión

Resumen y próximos pasos.
`;

    fs.writeFileSync(outputMdPath, mdTemplate);
}

console.log(`✅ Guía "${guideTitle}" generada correctamente:`);
console.log(`- HTML: ${outputHtmlPath}`);
console.log(`- Markdown: ${outputMdPath}`);
console.log('\nPuedes editar el contenido Markdown para personalizar la guía.');
