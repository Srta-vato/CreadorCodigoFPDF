// ============================================
// TEXT-DETECTION.JS - Detección de Texto del PDF
// ============================================
function detectTextInArea(x, y, width, height) {
    const pageNum = STATE.currentPage;
    const textContent = STATE.pdfTextContent[pageNum];
    const viewport = STATE.pdfViewports[pageNum];

    if (!textContent || !textContent.items || !viewport) {
        return '';
    }

    let detectedText = '';
    const tolerance = 2;

    textContent.items.forEach(item => {
        if (!item.transform || !item.str) return;

        // 🔥 Coordenadas REALES del texto en PDF
        const [a, b, c, d, tx, ty] = item.transform;

        // Convertir de espacio PDF → viewport → canvas
        const pdfPoint = viewport.convertToViewportPoint(tx, ty);

        const textX = pdfPoint[0];
        const textY = pdfPoint[1];

        const isInside =
            textX >= x - tolerance &&
            textX <= x + width + tolerance &&
            textY >= y - tolerance &&
            textY <= y + height + tolerance;

        if (isInside) {
            detectedText += item.str + ' ';
        }
    });

    return detectedText.trim();
}


function showTextDetectionModal(text, x, y, width, height) {
    const modal = document.getElementById('text-detection-modal');
    const textBox = document.getElementById('detected-text-content');
    
    if (!modal || !textBox) {
        // Si el modal no existe, crear elemento directamente
        createElementWithText(x, y, width, height, text);
        return;
    }
    
    if (text && text.length > 0) {
        textBox.innerHTML = `<p style="color: #c9d1d9; line-height: 1.8; word-wrap: break-word;">${text}</p>`;
    } else {
        textBox.innerHTML = `<div class="empty-state">No se detectó texto en esta área<br><small>El elemento se creará vacío</small></div>`;
    }
    
    STATE.tempTextData = { text, x, y, width, height };
    modal.classList.add('active');
}

function closeTextDetectionModal() {
    const modal = document.getElementById('text-detection-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    STATE.tempTextData = null;
}

function createTextElement() {
    if (!STATE.tempTextData) return;
    
    const { text, x, y, width, height } = STATE.tempTextData;
    const elementTypeSelect = document.getElementById('text-element-type');
    const elementType = elementTypeSelect ? elementTypeSelect.value : 'paragraph';
    
    createElementWithText(x, y, width, height, text, elementType);
    
    closeTextDetectionModal();
    showToast('✓ Elemento de texto creado');
}

function createElementWithText(x, y, width, height, text, elementType = 'paragraph') {
    let fontSize = 10;
    let fontStyle = '';
    let isMultiCell = false;
    
    switch(elementType) {
        case 'title':
            fontSize = 16;
            fontStyle = 'B';
            break;
        case 'subtitle':
            fontSize = 12;
            fontStyle = 'B';
            break;
        case 'paragraph':
            fontSize = 10;
            fontStyle = '';
            isMultiCell = true;
            break;
        case 'multicell':
            fontSize = 10;
            fontStyle = '';
            isMultiCell = true;
            break;
        case 'cell':
            fontSize = 10;
            fontStyle = '';
            isMultiCell = false;
            break;
    }
    
    const element = {
        id: generateId(),
        type: 'text',
        x: x,
        y: y,
        w: width,
        h: height,
        text: text || 'Texto aquí',
        font: 'Arial',
        style: fontStyle,
        size: fontSize,
        color: '#000000',
        bgColor: 'transparent',
        border: '0',
        align: 'L',
        isMultiCell: isMultiCell
    };
    
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
}
