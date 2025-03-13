// Markdown renderer for documentation pages
document.addEventListener('DOMContentLoaded', function() {
    const markdownContainer = document.getElementById('markdown-content');
    
    if (!markdownContainer) return;
    
    const markdownPath = markdownContainer.getAttribute('data-markdown-path');
    
    if (!markdownPath) {
        console.error('No se especificó la ruta del archivo markdown');
        return;
    }
    
    fetch(markdownPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo markdown');
            }
            return response.text();
        })
        .then(text => {
            // Configurar marked para usar Prism para resaltado de sintaxis
            marked.setOptions({
                highlight: function(code, lang) {
                    if (Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                }
            });
            
            // Renderizar el markdown
            markdownContainer.innerHTML = marked.parse(text);
            
            // Volver a aplicar Prism a los bloques de código
            Prism.highlightAll();
        })
        .catch(error => {
            console.error('Error al cargar el markdown:', error);
            markdownContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error al cargar el contenido</h4>
                    <p>${error.message}</p>
                </div>
            `;
        });
});
