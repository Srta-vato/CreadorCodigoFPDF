// ============================================
// CORE.JS - Estado Global e Inicialización
// VERSIÓN MEJORADA: Con soporte para grupos horizontales
// ============================================

const STATE = {
    pdf: null,
    totalPages: 0,
    currentPage: 1,
    scale: 1.5,
    zoom: 1.0,
    pdfViewports: {},
    elements: {},
    selectedElement: null,
    tool: 'select',
    isDrawing: false,
    startX: 0,
    startY: 0,
    showMargins: false,
    showGrid: false,
    gridSize: 10,
    snapToGrid: false,
    
    // Nuevas propiedades para detección de texto
    pdfTextContent: {},
    tempTextData: null,
    
    // Estructura del documento
    documentStructure: {
        header: [],
        body: [],
        footer: []
    },
    
    // Editor avanzado de tablas
    tableEditorData: null,
    selectedTableCells: [],
    
    // 🆕 NUEVAS PROPIEDADES PARA GRUPOS HORIZONTALES
    selectedElements: [],      // Array para selección múltiple
    multiSelectMode: false     // Indica si estamos en modo selección múltiple
};

const PIXELS_TO_MM = 0.264583;
const MM_TO_PIXELS = 3.7795275591;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// ============================================
// INICIALIZACIÓN
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    updateStats();
    updateDocumentStructure();
    document.addEventListener('keydown', handleKeyboard);
    
    // Agregar listener para doble clic
    const overlay = document.getElementById('canvas-overlay');
    if (overlay) {
        overlay.addEventListener('dblclick', handleDoubleClick);
    }
});

function initializeCanvas() {
    const overlay = document.getElementById('canvas-overlay');
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    
    updatePageInfo();
    createBlankCanvas();
}

function createBlankCanvas() {
    const canvas = document.getElementById('pdf-canvas');
    const overlay = document.getElementById('canvas-overlay');
    const gridCanvas = document.getElementById('grid-overlay');
    
    const width = 793;
    const height = 1122;
    
    canvas.width = width;
    canvas.height = height;
    overlay.width = width;
    overlay.height = height;
    gridCanvas.width = width;
    gridCanvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    STATE.elements[1] = [];
    STATE.currentPage = 1;
    STATE.totalPages = 1;
    
    updateMargins(width, height);
    drawGrid();
    
    document.getElementById('clear-btn').disabled = false;
    document.getElementById('auto-font-btn').disabled = false;
}

// ============================================
// CARGAR PDF
// ============================================
async function loadPDF(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading('Cargando PDF...', 10);
    
    try {
        const fileReader = new FileReader();
        fileReader.onload = async function(e) {
            const typedArray = new Uint8Array(e.target.result);
            showLoading('Analizando...', 30);
            
            const loadingTask = pdfjsLib.getDocument(typedArray);
            STATE.pdf = await loadingTask.promise;
            STATE.totalPages = STATE.pdf.numPages;
            STATE.currentPage = 1;
            
            // Extraer texto del PDF
            showLoading('Extrayendo texto del PDF...', 50);
            await extractAllTextFromPDF(STATE.pdf);
            
            for (let i = 1; i <= STATE.totalPages; i++) {
                if (!STATE.elements[i]) STATE.elements[i] = [];
            }
            
            showLoading('Renderizando...', 70);
            await renderPage(STATE.currentPage);
            
            updateStats();
            updateElementsList();
            updatePageInfo();
            
            document.getElementById('clear-btn').disabled = false;
            document.getElementById('prev-page').disabled = false;
            document.getElementById('next-page').disabled = false;
            document.getElementById('auto-font-btn').disabled = false;
            
            hideLoading();
            showToast('✓ PDF cargado - Texto extraído correctamente');
        };
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showToast('✗ Error al cargar PDF');
    }
}

async function extractAllTextFromPDF(pdf) {
    STATE.pdfTextContent = {};
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            STATE.pdfTextContent[pageNum] = textContent;
        } catch (error) {
            console.error(`Error extrayendo texto de página ${pageNum}:`, error);
        }
    }
}

async function renderPage(pageNum) {
    if (!STATE.pdf) return;
    
    const page = await STATE.pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: STATE.scale });
    STATE.pdfViewports[pageNum] = viewport;
    
    const canvas = document.getElementById('pdf-canvas');
    const overlay = document.getElementById('canvas-overlay');
    const gridCanvas = document.getElementById('grid-overlay');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    overlay.width = viewport.width;
    overlay.height = viewport.height;
    gridCanvas.width = viewport.width;
    gridCanvas.height = viewport.height;
    
    updateMargins(viewport.width, viewport.height);
    drawGrid();
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    redrawElements();
}

// ============================================
// HERRAMIENTAS
// ============================================
function setTool(tool) {
    STATE.tool = tool;
    ['select', 'text', 'table', 'image', 'line', 'rect'].forEach(t => {
        const btn = document.getElementById('tool-' + t);
        if (btn) btn.classList.remove('active');
    });
    const btn = document.getElementById('tool-' + tool);
    if (btn) btn.classList.add('active');
    
    const overlay = document.getElementById('canvas-overlay');
    overlay.style.cursor = tool === 'select' ? 'pointer' : 'crosshair';
}

// ============================================
// UTILIDADES GENERALES
// ============================================
function generateId() {
    return 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function countByType(type) {
    let count = 0;
    for (let page in STATE.elements) {
        count += STATE.elements[page].filter(el => el.type === type).length;
    }
    return count;
}

function handleKeyboard(e) {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateElement();
    }
    if (e.key === 'Delete') {
        deleteElement();
    }
}

function handleDoubleClick(e) {
    if (STATE.selectedElement && STATE.selectedElement.type === 'table') {
        openAdvancedTableEditor(STATE.selectedElement);
    }
}

function clearAll() {
    if (!confirm('¿Limpiar todo? Se perderán todos los elementos.')) return;
    
    STATE.pdf = null;
    STATE.totalPages = 0;
    STATE.elements = {};
    STATE.selectedElement = null;
    STATE.selectedElements = [];
    STATE.multiSelectMode = false;
    STATE.documentStructure = {
        header: [],
        body: [],
        footer: []
    };
    
    const canvas = document.getElementById('pdf-canvas');
    const overlay = document.getElementById('canvas-overlay');
    const ctx = canvas.getContext('2d');
    const ctxOverlay = overlay.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);
    
    createBlankCanvas();
    updateStats();
    updateElementsList();
    updatePageInfo();
    updatePropertiesPanel();
    updateToolbarButtons();
    updateDocumentStructure();
    
    showToast('✓ Todo limpiado');
}

function showHelp() {
    alert(`PDF DESIGNER PRO - SISTEMA COMPLETO CON GRUPOS HORIZONTALES

🎯 HERRAMIENTAS PRINCIPALES:
• Seleccionar - Click en elementos para editarlos
• Texto - Dibujar cajas de texto con DETECCIÓN AUTOMÁTICA de texto del PDF
• Tabla - Crear tablas con editor avanzado (doble clic)
• Imagen - Marcar áreas para imágenes/logos
• Línea - Dibujar líneas
• Rectángulo - Dibujar marcos y bordes

✨ NUEVAS FUNCIONALIDADES:
• DETECCIÓN DE TEXTO - Al crear un elemento de texto, detecta automáticamente el contenido
• EDITOR AVANZADO DE TABLAS - Doble clic en tablas para edición completa
• ESTRUCTURA DEL DOCUMENTO - Asigna elementos a Header, Body o Footer
• 🆕 GRUPOS HORIZONTALES - Mantén Ctrl y selecciona múltiples elementos para agruparlos
• VISTA PREVIA EN TIEMPO REAL - Visualiza cómo quedará tu documento

🎨 GRUPOS HORIZONTALES (NUEVA FUNCIÓN):
• Mantén Ctrl (o Cmd en Mac) y haz clic en cada elemento
• Click en "Agrupar Horizontal" para crear el grupo
• Los elementos agrupados se renderizarán en la misma línea Y
• Usa "Desagrupar" para separar elementos
• Perfecto para logos + títulos o elementos de encabezado

📋 FLUJO DE TRABAJO RECOMENDADO:
1. Carga tu PDF
2. Selecciona las partes pequeñas (títulos, párrafos, tablas, imágenes)
3. Para elementos en la misma fila: Ctrl+Click en cada uno → Agrupar Horizontal
4. Asigna cada elemento/grupo a su sección (Header/Body/Footer)
5. Edita las propiedades según necesites
6. Visualiza la vista previa
7. Genera el código FPDF

🎨 TABLAS AVANZADAS:
• Añadir/quitar filas y columnas
• Combinar celdas
• Cambiar color de encabezado
• Ajustar tamaño de fuente
• Marcar celdas como encabezado
• Editar texto en cada celda

💻 ESTRUCTURA DEL CÓDIGO:
• Header - Se ejecuta en todas las páginas (logos, títulos)
• Body - Contenido principal del documento
• Footer - Pie de página en todas las páginas

⌨️ ATAJOS:
• Ctrl+D: Duplicar elemento
• Delete: Eliminar elemento
• Ctrl+Click: Selección múltiple
• Doble clic en tabla: Editor avanzado

¡Sistema profesional para replicar CUALQUIER PDF con grupos horizontales!`);
}

console.log('%c✨ PDF Designer Pro - Sistema con Grupos Horizontales Cargado', 'color: #3fb950; font-size: 16px; font-weight: bold;');x
