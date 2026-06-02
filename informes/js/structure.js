// ============================================
// STRUCTURE.JS - Gestión de Estructura del Documento
// ============================================

function toggleStructureSection(section) {
    const elementsDiv = document.getElementById(`${section}-elements`);
    if (!elementsDiv) return;
    
    const header = elementsDiv.previousElementSibling;
    const icon = header ? header.querySelector('.fa-chevron-down') : null;
    
    if (elementsDiv.style.display === 'none' || !elementsDiv.style.display) {
        elementsDiv.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        elementsDiv.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(-90deg)';
    }
}

function assignToSection() {
    if (!STATE.selectedElement) {
        showToast('✗ Selecciona un elemento primero');
        return;
    }
    
    const modal = document.getElementById('section-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeSectionModal() {
    const modal = document.getElementById('section-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function assignElementToSection(section) {
    if (!STATE.selectedElement) return;
    
    const elementId = STATE.selectedElement.id;
    
    // Remover de otras secciones
    ['header', 'body', 'footer'].forEach(sec => {
        const index = STATE.documentStructure[sec].indexOf(elementId);
        if (index > -1) {
            STATE.documentStructure[sec].splice(index, 1);
        }
    });
    
    STATE.documentStructure[section].push(elementId);
    STATE.selectedElement.section = section;
    
    updateDocumentStructure();
    updatePropertiesPanel();
    closeSectionModal();
    showToast(`✓ Elemento asignado a ${section.toUpperCase()}`);
}

function updateDocumentStructure() {
    ['header', 'body', 'footer'].forEach(section => {
        const container = document.getElementById(`${section}-elements`);
        const countSpan = document.getElementById(`${section}-count`);
        
        if (!container) return;
        
        container.innerHTML = '';
        
        const elementIds = STATE.documentStructure[section];
        if (countSpan) {
            countSpan.textContent = elementIds.length;
        }
        
        if (elementIds.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 11px;">Sin elementos</div>';
            return;
        }
        
        elementIds.forEach(elementId => {
            let element = null;
            for (let page in STATE.elements) {
                element = STATE.elements[page].find(el => el.id === elementId);
                if (element) break;
            }
            
            if (!element) return;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'structure-element-item';
            
            let displayText = element.text || element.type;
            if (element.type === 'table') {
                displayText = `Tabla ${element.rows}x${element.cols}`;
            }
            
            itemDiv.innerHTML = `
                <span class="element-badge badge-${element.type}">${element.type}</span>
                <span style="font-size: 11px;">${displayText.substring(0, 30)}</span>
            `;
            
            itemDiv.onclick = (e) => {
                e.stopPropagation();
                selectElementById(elementId);
            };
            
            container.appendChild(itemDiv);
        });
    });
}

function selectElementById(elementId) {
    for (let page in STATE.elements) {
        const element = STATE.elements[page].find(el => el.id === elementId);
        if (element) {
            const pageNum = parseInt(page);
            if (pageNum !== STATE.currentPage) {
                STATE.currentPage = pageNum;
                renderPage(STATE.currentPage);
                updatePageInfo();
            }
            STATE.selectedElement = element;
            redrawOverlay();
            updatePropertiesPanel();
            updateToolbarButtons();
            updateElementsList();
            return;
        }
    }
}
