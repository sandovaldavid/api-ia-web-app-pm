const fs = require('fs');
const path = require('path');

// Paths
const guidesDir = path.join(__dirname, '../docs/guides');
const templatePath = path.join(guidesDir, 'guide-template.html');

// Check if directories exist
if (!fs.existsSync(guidesDir)) {
    console.error(`Error: The guides directory '${guidesDir}' does not exist.`);
    process.exit(1);
}

if (!fs.existsSync(templatePath)) {
    console.error(`Error: The template file '${templatePath}' does not exist.`);
    process.exit(1);
}

// Read the template
const template = fs.readFileSync(templatePath, 'utf8');

// Get all markdown files in the guides directory
const markdownFiles = fs.readdirSync(guidesDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md');

console.log(`Found ${markdownFiles.length} markdown guide files to process.`);

let processedFiles = 0;

markdownFiles.forEach(mdFile => {
    const mdPath = path.join(guidesDir, mdFile);
    const guideName = path.basename(mdFile, '.md');
    const htmlPath = path.join(guidesDir, `${guideName}.html`);
    
    try {
        // Read the markdown file
        const mdContent = fs.readFileSync(mdPath, 'utf8');
        
        // Extract title and emoji from the first line
        const firstLine = mdContent.split('\n')[0];
        const titleMatch = firstLine.match(/^# (.*)/);
        
        if (!titleMatch) {
            console.warn(`Warning: Could not extract title from ${mdFile}. Skipping.`);
            return;
        }
        
        const fullTitle = titleMatch[1];
        let emoji = '';
        let title = fullTitle;
        
        // Extract emoji if present
        const emojiMatch = fullTitle.match(/^([^\w\s]+)\s+(.*)/);
        if (emojiMatch) {
            emoji = emojiMatch[1];
            title = emojiMatch[2];
        }
        
        // Create a customized copy of the template
        let htmlContent = template;
        
        // Replace placeholders
        htmlContent = htmlContent.replace('{{GUIDE_TITLE}}', title);
        htmlContent = htmlContent.replace('{{MARKDOWN_PATH}}', `/docs/guides/${guideName}.md`);
        
        // Mark this guide as active in the sidebar
        htmlContent = htmlContent.replace(
            new RegExp(`{{#if ${guideName}}}active{{/if}}`, 'g'), 
            'active'
        );
        
        // Remove other activation placeholders
        htmlContent = htmlContent.replace(/{{#if .*?}}active{{\/if}}/g, '');
        
        // Write the HTML file
        fs.writeFileSync(htmlPath, htmlContent);
        processedFiles++;
        
        console.log(`✅ Generated HTML for "${emoji} ${title}" (${guideName}.html)`);
    } catch (error) {
        console.error(`Error processing ${mdFile}: ${error.message}`);
    }
});

console.log(`\n🎉 Documentation generation complete! Processed ${processedFiles} guides.`);
console.log(`\nHTML files have been created in: ${guidesDir}`);
