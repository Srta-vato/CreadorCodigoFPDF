// ============================================
// CANVAS.JS - Manejo del Canvas y Dibujo
// VERSIÓN MEJORADA: Con soporte para selección múltiple
// ============================================

function handleMouseDown(e) {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / STATE.zoom;
    const y = (e.clientY - rect.top) / STATE.zoom;
    
    // 🆕 DETECTAR SI SE PRESIONÓ CTRL O CMD (Mac)
    STATE.multiSelectMode = e.ctrlKey || e.metaKey;
    
    if (STATE.tool === 'select') {
        selectElement(x, y);
    } else {
        STATE.isDrawing = true;
        STATE.startX = STATE.snapToGrid ? snapToGrid(x) : x;
        STATE.startY = STATE.snapToGrid ? snapToGrid(y) : y;
    }
}

function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / STATE.zoom;
    const y = (e.clientY - rect.top) / STATE.zoom;
    
    if (STATE.isDrawing) {
        const currentX = STATE.snapToGrid ? snapToGrid(x) : x;
        const currentY = STATE.snapToGrid ? snapToGrid(y) : y;
        drawTemporaryElement(STATE.startX, STATE.startY, currentX, currentY);
        showMeasurementTooltip(e.clientX, e.clientY, currentX - STATE.startX, currentY - STATE.startY);
    }
}

function handleMouseUp(e) {
    if (!STATE.isDrawing) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / STATE.zoom;
    const y = (e.clientY - rect.top) / STATE.zoom;
    
    STATE.isDrawing = false;
    hideMeasurementTooltip();
    
    const endX = STATE.snapToGrid ? snapToGrid(x) : x;
    const endY = STATE.snapToGrid ? snapToGrid(y) : y;
    
    const width = Math.abs(endX - STATE.startX);
    const height = Math.abs(endY - STATE.startY);
    
    if (width > 5 && height > 5) {
        const finalX = Math.min(STATE.startX, endX);
        const finalY = Math.min(STATE.startY, endY);
        
        // Si es texto y hay contenido en el PDF, detectar texto
        if (STATE.tool === 'text' && STATE.pdfTextContent[STATE.currentPage]) {
            const detectedText = detectTextInArea(finalX, finalY, width, height);
            showTextDetectionModal(detectedText, finalX, finalY, width, height);
        } else {
            createElement(finalX, finalY, width, height);
        }
    }
    
    redrawOverlay();
}

// 🆕 FUNCIÓN MEJORADA: Soporta selección múltiple con Ctrl
function selectElement(x, y) {
    const elements = STATE.elements[STATE.currentPage] || [];
    
    // 🔧 ASEGURAR QUE selectedElements EXISTE
    if (!STATE.selectedElements) {
        STATE.selectedElements = [];
    }
    
    // Buscar elemento clickeado
    let clickedElement = null;
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
            clickedElement = el;
            break;
        }
    }
    
    if (!clickedElement) {
        // No se encontró elemento
        STATE.selectedElement = null;
        STATE.selectedElements = [];
        updatePropertiesPanel();
        updateToolbarButtons();
        updateElementsList();
        redrawOverlay();
        return;
    }
    
    // Si NO hay Ctrl presionado, selección simple
    if (!STATE.multiSelectMode) {
        STATE.selectedElement = clickedElement;
        STATE.selectedElements = [clickedElement];
    } else {
        // Modo selección múltiple (Ctrl presionado)
        const index = STATE.selectedElements.indexOf(clickedElement);
        if (index > -1) {
            // Ya está seleccionado, deseleccionar
            STATE.selectedElements.splice(index, 1);
        } else {
            // No está seleccionado, agregar
            STATE.selectedElements.push(clickedElement);
        }
        STATE.selectedElement = STATE.selectedElements[STATE.selectedElements.length - 1] || null;
    }
    
    updatePropertiesPanel();
    updateToolbarButtons();
    updateElementsList();
    redrawOverlay();
}

function drawTemporaryElement(startX, startY, endX, endY) {
    const canvas = document.getElementById('canvas-overlay');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawOverlay();
    
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const w = endX - startX;
    const h = endY - startY;
    
    if (STATE.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    } else {
        ctx.strokeRect(startX, startY, w, h);
    }
    
    ctx.setLineDash([]);
}

// 🆕 FUNCIÓN MEJORADA: Muestra todos los elementos seleccionados
function redrawOverlay() {
    const canvas = document.getElementById('canvas-overlay');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const elements = STATE.elements[STATE.currentPage] || [];
    
    // 🔧 ASEGURAR QUE selectedElements EXISTE
    const selectedElements = STATE.selectedElements || [];
    
    elements.forEach(el => {
        // Verificar si está seleccionado (individual o múltiple)
        const isSelected = selectedElements.includes(el);
        
        if (isSelected) {
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        } else {
            ctx.strokeStyle = 'rgba(88, 166, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
        }
        
        ctx.strokeRect(el.x, el.y, el.w, el.h);
        ctx.setLineDash([]);
        
        // Mostrar etiqueta del tipo de elemento
        if (isSelected) {
            ctx.fillStyle = '#1f6feb';
            ctx.font = '11px Arial';
            const label = el.isGrouped ? `${el.type.toUpperCase()} (GRUPO)` : el.type.toUpperCase();
            ctx.fillText(label, el.x, el.y - 5);
        }
    });
    
    // 🆕 MOSTRAR CONTADOR DE SELECCIÓN MÚLTIPLE
    if (selectedElements.length > 1) {
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${selectedElements.length} elementos seleccionados`, 10, 20);
    }
}

function redrawElements() {
    redrawOverlay();
}

function showMeasurementTooltip(x, y, w, h) {
    const tooltip = document.getElementById('measurement-tooltip');
    if (!tooltip) return;
    
    tooltip.style.left = x + 20 + 'px';
    tooltip.style.top = y + 20 + 'px';
    tooltip.innerHTML = `${Math.abs(w).toFixed(0)}px × ${Math.abs(h).toFixed(0)}px<br>${(Math.abs(w) * PIXELS_TO_MM).toFixed(1)}mm × ${(Math.abs(h) * PIXELS_TO_MM).toFixed(1)}mm`;
    tooltip.style.display = 'block';
}

function hideMeasurementTooltip() {
    const tooltip = document.getElementById('measurement-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// ============================================
// GRILLA Y MÁRGENES
// ============================================
function toggleGrid() {
    STATE.showGrid = !STATE.showGrid;
    const gridCanvas = document.getElementById('grid-overlay');
    if (gridCanvas) {
        gridCanvas.classList.toggle('show', STATE.showGrid);
    }
    drawGrid();
    showToast(STATE.showGrid ? '✓ Grilla activada' : '✗ Grilla desactivada');
}

function toggleMargins() {
    STATE.showMargins = !STATE.showMargins;
    const guides = ['margin-top', 'margin-bottom', 'margin-left', 'margin-right'];
    guides.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('show', STATE.showMargins);
    });
    showToast(STATE.showMargins ? '✓ Márgenes activados' : '✗ Márgenes desactivados');
}

function toggleSnapToGrid() {
    STATE.snapToGrid = !STATE.snapToGrid;
    showToast(STATE.snapToGrid ? '✓ Ajustar a grilla activado' : '✗ Ajustar a grilla desactivado');
}

function snapToGrid(value) {
    return Math.round(value / STATE.gridSize) * STATE.gridSize;
}

function drawGrid() {
    const canvas = document.getElementById('grid-overlay');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!STATE.showGrid) return;
    
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += STATE.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += STATE.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateMargins(width, height) {
    if (!STATE.showMargins) return;
    
    const marginSize = 20; // mm
    const marginPx = marginSize * MM_TO_PIXELS;
    
    const guides = {
        'margin-top': { top: marginPx + 'px', left: 0, right: 0, height: '1px' },
        'margin-bottom': { bottom: marginPx + 'px', left: 0, right: 0, height: '1px' },
        'margin-left': { left: marginPx + 'px', top: 0, bottom: 0, width: '1px' },
        'margin-right': { right: marginPx + 'px', top: 0, bottom: 0, width: '1px' }
    };
    
    for (let id in guides) {
        const el = document.getElementById(id);
        if (el) {
            Object.assign(el.style, guides[id]);
        }
    }
}

// ============================================
// ZOOM Y NAVEGACIÓN
// ============================================
function setZoom(zoom) {
    STATE.zoom = zoom;
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `scale(${zoom})`;
    }
}

function updateZoom(value) {
    const zoom = value / 100;
    setZoom(zoom);
    document.getElementById('zoom-value').textContent = value + '%';
}

function zoomIn() {
    const slider = document.getElementById('zoom-slider');
    const newValue = Math.min(200, parseInt(slider.value) + 10);
    slider.value = newValue;
    updateZoom(newValue);
}

function zoomOut() {
    const slider = document.getElementById('zoom-slider');
    const newValue = Math.max(50, parseInt(slider.value) - 10);
    slider.value = newValue;
    updateZoom(newValue);
}

function nextPage() {
    if (STATE.currentPage < STATE.totalPages) {
        STATE.currentPage++;
        renderPage(STATE.currentPage);
        updatePageInfo();
        updateElementsList();
        STATE.selectedElement = null;
        STATE.selectedElements = [];
        updatePropertiesPanel();
        updateToolbarButtons();
    }
}

function prevPage() {
    if (STATE.currentPage > 1) {
        STATE.currentPage--;
        renderPage(STATE.currentPage);
        updatePageInfo();
        updateElementsList();
        STATE.selectedElement = null;
        STATE.selectedElements = [];
        updatePropertiesPanel();
        updateToolbarButtons();
    }
}

function updatePageInfo() {
    const pageInfo = document.getElementById('page-info');
    const elementsPage = document.getElementById('elements-page');
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${STATE.currentPage} de ${STATE.totalPages}`;
    }
    if (elementsPage) {
        elementsPage.textContent = STATE.currentPage;
    }
}
