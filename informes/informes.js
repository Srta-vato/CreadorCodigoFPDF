// ============================================
// ELEMENTS.JS - Gestión de Elementos
// ============================================

function createElement(x, y, w, h) {
    const element = {
        id: generateId(),
        type: STATE.tool,
        x: x,
        y: y,
        w: w,
        h: h
    };
    
    switch (STATE.tool) {
        case 'text':
            element.text = 'Texto aquí';
            element.font = 'Arial';
            element.style = '';
            element.size = 12;
            element.color = '#000000';
            element.bgColor = 'transparent';
            element.border = '1';
            element.align = 'L';
            element.isMultiCell = false;
            break;
            
        case 'table':
            element.rows = 3;
            element.cols = 4;
            element.font = 'Arial';
            element.size = 10;
            element.headerColor = '#d3d3d3';
            element.textColor = '#000000';
            element.tableData = { rows: 3, cols: 4, cells: [] };
            
            // Inicializar celdas
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 4; c++) {
                    element.tableData.cells.push({
                        row: r,
                        col: c,
                        text: `C${r+1}${c+1}`,
                        isHeader: r === 0,
                        merged: false,
                        rowspan: 1,
                        colspan: 1
                    });
                }
            }
            break;
            
        case 'image':
            element.path = 'imagen.jpg';
            break;
            
        case 'line':
            element.color = '#000000';
            element.thickness = 1;
            break;
            
        case 'rect':
            element.color = '#000000';
            element.thickness = 1;
            element.fill = false;
            element.fillColor = '#ffffff';
            break;
    }
    
    if (!STATE.elements[STATE.currentPage]) {
        STATE.elements[STATE.currentPage] = [];
    }
    
    STATE.elements[STATE.currentPage].push(element);
    STATE.selectedElement = element;
    
    updateStats();
    updateElementsList();
    updatePropertiesPanel();
    updateToolbarButtons();
    redrawOverlay();
    
    showToast(`✓ ${STATE.tool} creado`);
}

function selectElement(x, y) {
    const elements = STATE.elements[STATE.currentPage] || [];
    
    // Buscar en orden inverso para seleccionar el de arriba
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
            STATE.selectedElement = el;
            updatePropertiesPanel();
            updateToolbarButtons();
            updateElementsList();
            redrawOverlay();
            return;
        }
    }
    
    // Si no se seleccionó nada
    STATE.selectedElement = null;
    updatePropertiesPanel();
    updateToolbarButtons();
    updateElementsList();
    redrawOverlay();
}

function deleteElement() {
    if (!STATE.selectedElement) return;
    
    const elements = STATE.elements[STATE.currentPage];
    const index = elements.indexOf(STATE.selectedElement);
    
    if (index > -1) {
        // Eliminar de estructura del documento
        const elementId = STATE.selectedElement.id;
        ['header', 'body', 'footer'].forEach(section => {
            const idx = STATE.documentStructure[section].indexOf(elementId);
            if (idx > -1) {
                STATE.documentStructure[section].splice(idx, 1);
            }
        });
        
        elements.splice(index, 1);
        STATE.selectedElement = null;
        
        updateStats();
        updateElementsList();
        updatePropertiesPanel();
        updateToolbarButtons();
        updateDocumentStructure();
        redrawOverlay();
        
        showToast('✓ Elemento eliminado');
    }
}

function duplicateElement() {
    if (!STATE.selectedElement) return;
    
    const original = STATE.selectedElement;
    const duplicate = JSON.parse(JSON.stringify(original));
    
    duplicate.id = generateId();
    duplicate.x += 10;
    duplicate.y += 10;
    
    STATE.elements[STATE.currentPage].push(duplicate);
    STATE.selectedElement = duplicate;
    
    updateStats();
    updateElementsList();
    updatePropertiesPanel();
    redrawOverlay();
    
    showToast('✓ Elemento duplicado');
}

function bringToFront() {
    if (!STATE.selectedElement) return;
    
    const elements = STATE.elements[STATE.currentPage];
    const index = elements.indexOf(STATE.selectedElement);
    
    if (index > -1) {
        elements.splice(index, 1);
        elements.push(STATE.selectedElement);
        redrawOverlay();
        updateElementsList();
        showToast('✓ Traído al frente');
    }
}

function sendToBack() {
    if (!STATE.selectedElement) return;
    
    const elements = STATE.elements[STATE.currentPage];
    const index = elements.indexOf(STATE.selectedElement);
    
    if (index > -1) {
        elements.splice(index, 1);
        elements.unshift(STATE.selectedElement);
        redrawOverlay();
        updateElementsList();
        showToast('✓ Enviado atrás');
    }
}

function updateElementProperty(prop, value) {
    if (!STATE.selectedElement) return;
    
    STATE.selectedElement[prop] = value;
    redrawOverlay();
    updateStats();
    updateElementsList();
}

function updateElementsList() {
    const list = document.getElementById('elements-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    const elements = STATE.elements[STATE.currentPage] || [];
    
    if (elements.length === 0) {
        list.innerHTML = '<div class="empty-state">Sin elementos en esta página</div>';
        return;
    }
    
    elements.forEach((el, index) => {
        const item = document.createElement('div');
        item.className = 'element-item';
        if (el === STATE.selectedElement) {
            item.classList.add('active');
        }
        
        let badgeClass = 'badge-' + el.type;
        let displayText = el.text || el.type;
        if (el.type === 'table') {
            displayText = `Tabla ${el.rows}x${el.cols}`;
        }
        
        item.innerHTML = `
            <span class="element-badge ${badgeClass}">${el.type}</span>
            <div class="element-text">${displayText}</div>
        `;
        
        item.onclick = () => {
            STATE.selectedElement = el;
            updatePropertiesPanel();
            updateToolbarButtons();
            updateElementsList();
            redrawOverlay();
        };
        
        list.appendChild(item);
    });
}

function updatePropertiesPanel() {
    const panel = document.getElementById('properties-content');
    if (!panel) return;
    
    if (!STATE.selectedElement) {
        panel.innerHTML = '<div class="empty-state">Selecciona un elemento para editar sus propiedades</div>';
        return;
    }
    
    const el = STATE.selectedElement;
    let html = `
        <div class="property-group">
            <label class="property-label">Posición y Tamaño</label>
            <div class="property-row">
                <div>
                    <label class="property-sublabel">X (px)</label>
                    <input type="number" class="property-input" value="${el.x.toFixed(0)}" onchange="updateElementProperty('x', parseFloat(this.value))">
                </div>
                <div>
                    <label class="property-sublabel">Y (px)</label>
                    <input type="number" class="property-input" value="${el.y.toFixed(0)}" onchange="updateElementProperty('y', parseFloat(this.value))">
                </div>
            </div>
            <div class="property-row">
                <div>
                    <label class="property-sublabel">Ancho</label>
                    <input type="number" class="property-input" value="${el.w.toFixed(0)}" onchange="updateElementProperty('w', parseFloat(this.value))">
                </div>
                <div>
                    <label class="property-sublabel">Alto</label>
                    <input type="number" class="property-input" value="${el.h.toFixed(0)}" onchange="updateElementProperty('h', parseFloat(this.value))">
                </div>
            </div>
            <small class="property-hint">Posición: ${(el.x * PIXELS_TO_MM).toFixed(1)}mm, ${(el.y * PIXELS_TO_MM).toFixed(1)}mm | Tamaño: ${(el.w * PIXELS_TO_MM).toFixed(1)}mm × ${(el.h * PIXELS_TO_MM).toFixed(1)}mm</small>
        </div>
    `;
    
    if (el.type === 'text') {
        html += `
            <div class="property-group">
                <label class="property-label">Contenido</label>
                <textarea class="property-input" rows="4" onchange="updateElementProperty('text', this.value)">${el.text}</textarea>
            </div>
            
            <div class="property-group">
                <label class="property-label">Tipografía</label>
                <div class="property-row">
                    <div>
                        <label class="property-sublabel">Fuente</label>
                        <select class="property-input" onchange="updateElementProperty('font', this.value)">
                            <option ${el.font === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option ${el.font === 'Times' ? 'selected' : ''}>Times</option>
                            <option ${el.font === 'Courier' ? 'selected' : ''}>Courier</option>
                            <option ${el.font === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                        </select>
                    </div>
                    <div>
                        <label class="property-sublabel">Tamaño</label>
                        <input type="number" class="property-input" value="${el.size}" min="6" max="72" onchange="updateElementProperty('size', parseInt(this.value))">
                    </div>
                </div>
                
                <label class="property-sublabel">Estilo</label>
                <select class="property-input" onchange="updateElementProperty('style', this.value)">
                    <option value="" ${el.style === '' ? 'selected' : ''}>Normal</option>
                    <option value="B" ${el.style === 'B' ? 'selected' : ''}>Negrita</option>
                    <option value="I" ${el.style === 'I' ? 'selected' : ''}>Cursiva</option>
                    <option value="U" ${el.style === 'U' ? 'selected' : ''}>Subrayado</option>
                    <option value="BI" ${el.style === 'BI' ? 'selected' : ''}>Negrita + Cursiva</option>
                </select>
                
                <label class="property-sublabel">Alineación</label>
                <select class="property-input" onchange="updateElementProperty('align', this.value)">
                    <option value="L" ${el.align === 'L' ? 'selected' : ''}>Izquierda</option>
                    <option value="C" ${el.align === 'C' ? 'selected' : ''}>Centro</option>
                    <option value="R" ${el.align === 'R' ? 'selected' : ''}>Derecha</option>
                    <option value="J" ${el.align === 'J' ? 'selected' : ''}>Justificado</option>
                </select>
            </div>
            
            <div class="property-group">
                <label class="property-label">Colores</label>
                <div class="property-row">
                    <div>
                        <label class="property-sublabel">Texto</label>
                        <input type="color" class="property-input color-input" value="${el.color}" onchange="updateElementProperty('color', this.value)">
                    </div>
                    <div>
                        <label class="property-sublabel">Fondo</label>
                        <input type="color" class="property-input color-input" value="${el.bgColor === 'transparent' ? '#ffffff' : el.bgColor}" onchange="updateElementProperty('bgColor', this.value)">
                    </div>
                </div>
            </div>
            
            <div class="property-group">
                <label class="property-label">Opciones</label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" ${el.isMultiCell ? 'checked' : ''} onchange="updateElementProperty('isMultiCell', this.checked)">
                    <span>Usar MultiCell (texto largo)</span>
                </label>
            </div>
        `;
    }
    
    if (el.type === 'table') {
        html += `
            <div class="property-group">
                <label class="property-label">Tabla (${el.rows}x${el.cols})</label>
                <button class="btn btn-primary btn-block" onclick="openAdvancedTableEditor(STATE.selectedElement)">
                    <i class="fas fa-edit"></i> Editor Avanzado
                </button>
                <small class="property-hint">💡 Doble clic en la tabla para abrir el editor</small>
            </div>
            
            <div class="property-group">
                <label class="property-label">Tipografía</label>
                <div class="property-row">
                    <div>
                        <label class="property-sublabel">Fuente</label>
                        <select class="property-input" onchange="updateElementProperty('font', this.value)">
                            <option ${el.font === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option ${el.font === 'Times' ? 'selected' : ''}>Times</option>
                            <option ${el.font === 'Courier' ? 'selected' : ''}>Courier</option>
                        </select>
                    </div>
                    <div>
                        <label class="property-sublabel">Tamaño</label>
                        <input type="number" class="property-input" value="${el.size}" min="6" max="24" onchange="updateElementProperty('size', parseInt(this.value))">
                    </div>
                </div>
            </div>
        `;
    }
    
    if (el.type === 'image') {
        html += `
            <div class="property-group">
                <label class="property-label">Ruta de Imagen</label>
                <input type="text" class="property-input" value="${el.path}" onchange="updateElementProperty('path', this.value)" placeholder="imagen.jpg">
                <small class="property-hint">Ruta relativa al archivo PHP</small>
            </div>
        `;
    }
    
    if (el.type === 'line') {
        html += `
            <div class="property-group">
                <label class="property-label">Línea</label>
                <div class="property-row">
                    <div>
                        <label class="property-sublabel">Color</label>
                        <input type="color" class="property-input color-input" value="${el.color}" onchange="updateElementProperty('color', this.value)">
                    </div>
                    <div>
                        <label class="property-sublabel">Grosor</label>
                        <input type="number" class="property-input" value="${el.thickness}" min="0.1" max="10" step="0.1" onchange="updateElementProperty('thickness', parseFloat(this.value))">
                    </div>
                </div>
            </div>
        `;
    }
    
    if (el.type === 'rect') {
        html += `
            <div class="property-group">
                <label class="property-label">Rectángulo</label>
                <div class="property-row">
                    <div>
                        <label class="property-sublabel">Borde</label>
                        <input type="color" class="property-input color-input" value="${el.color}" onchange="updateElementProperty('color', this.value)">
                    </div>
                    <div>
                        <label class="property-sublabel">Grosor</label>
                        <input type="number" class="property-input" value="${el.thickness}" min="0.1" max="10" step="0.1" onchange="updateElementProperty('thickness', parseFloat(this.value))">
                    </div>
                </div>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 10px;">
                    <input type="checkbox" ${el.fill ? 'checked' : ''} onchange="updateElementProperty('fill', this.checked)">
                    <span>Rellenar</span>
                </label>
                ${el.fill ? `
                    <div style="margin-top: 10px;">
                        <label class="property-sublabel">Color de Relleno</label>
                        <input type="color" class="property-input color-input" value="${el.fillColor}" onchange="updateElementProperty('fillColor', this.value)">
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Mostrar sección asignada
    if (el.section) {
        const sectionIcons = {
            header: 'file-alt',
            body: 'align-left',
            footer: 'file-alt'
        };
        html += `
            <div class="property-group">
                <label class="property-label">Asignado a</label>
                <div style="padding: 10px; background: #161b22; border-radius: 6px; border-left: 3px solid #58a6ff;">
                    <i class="fas fa-${sectionIcons[el.section]}"></i>
                    ${el.section.toUpperCase()}
                </div>
            </div>
        `;
    }
    
    panel.innerHTML = html;
}

function updateToolbarButtons() {
    const hasSelection = STATE.selectedElement !== null;
    
    const buttons = [
        'delete-btn',
        'duplicate-btn',
        'bring-front-btn',
        'send-back-btn',
        'assign-section-btn'
    ];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = !hasSelection;
    });
}

function autoAdjustFonts() {
    const elements = STATE.elements[STATE.currentPage] || [];
    let adjusted = 0;
    
    elements.forEach(el => {
        if (el.type === 'text') {
            const textLength = el.text.length;
            const area = el.w * el.h;
            const suggestedSize = Math.min(24, Math.max(8, Math.sqrt(area / textLength)));
            
            el.size = Math.round(suggestedSize);
            adjusted++;
        }
    });
    
    if (adjusted > 0) {
        redrawOverlay();
        updatePropertiesPanel();
        showToast(`✓ ${adjusted} fuentes ajustadas`);
    } else {
        showToast('✗ No hay elementos de texto');
    }
}
