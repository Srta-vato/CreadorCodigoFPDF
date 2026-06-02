// ============================================
// TABLE-EDITOR.JS - Editor Profesional de Tablas
// VERSIÓN ULTRA MEJORADA: Nivel Excel/Canva/Word con TODAS las funcionalidades
// ============================================

// Variables globales del editor
let tableEditorState = {
    currentTable: null,
    selectedCells: [],
    isSelectingCells: false,
    selectionStart: null,
    clipboard: null,
    history: [],
    historyIndex: -1
};

// ============================================
// ABRIR EDITOR AVANZADO
// ============================================

function openAdvancedTableEditor(element) {
    if (!element || element.type !== 'table') return;
    
    // Clonar profundamente el elemento
    tableEditorState.currentTable = JSON.parse(JSON.stringify(element));
    tableEditorState.selectedCells = [];
    tableEditorState.history = [];
    tableEditorState.historyIndex = -1;
    tableEditorState.clipboard = null;
    tableEditorState.isSelectingCells = false;
    tableEditorState.selectionStart = null;
    
    // Asegurar estructura de datos completa
    if (!tableEditorState.currentTable.tableData) {
        tableEditorState.currentTable.tableData = { cells: [] };
    }
    if (!tableEditorState.currentTable.tableData.cells) {
        tableEditorState.currentTable.tableData.cells = [];
    }
    
    // Inicializar todas las celdas
    initializeTableCells();
    
    // Guardar estado inicial en historial
    saveToHistory();
    
    renderTableEditor();
    
    const modal = document.getElementById('advanced-table-modal');
    if (modal) {
        modal.classList.add('active');
    }
    
    // Establecer valores iniciales en controles
    updateEditorControls();
    
    // Configurar eventos de teclado
    setupTableEditorKeyboardShortcuts();
    
    showToast('✓ Editor de tablas abierto - Usa Ctrl+Click para seleccionar múltiples celdas');
}

function updateEditorControls() {
    const table = tableEditorState.currentTable;
    
    const fontSizeInput = document.getElementById('table-font-size');
    const headerColorInput = document.getElementById('table-header-color');
    const borderColorInput = document.getElementById('table-border-color');
    const borderWidthInput = document.getElementById('table-border-width');
    const cellPaddingInput = document.getElementById('table-cell-padding');
    
    if (fontSizeInput) fontSizeInput.value = table.size || 10;
    if (headerColorInput) headerColorInput.value = table.headerColor || '#4472C4';
    if (borderColorInput) borderColorInput.value = table.borderColor || '#000000';
    if (borderWidthInput) borderWidthInput.value = table.borderWidth || 1;
    if (cellPaddingInput) cellPaddingInput.value = table.cellPadding || 2;
}

function initializeTableCells() {
    const table = tableEditorState.currentTable;
    
    for (let r = 0; r < table.rows; r++) {
        for (let c = 0; c < table.cols; c++) {
            let cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            
            if (!cell) {
                table.tableData.cells.push({
                    row: r,
                    col: c,
                    text: '',
                    isHeader: false,
                    merged: false,
                    mergedInto: null, // Nueva propiedad para saber a qué celda está combinada
                    rowspan: 1,
                    colspan: 1,
                    // Propiedades de diseño individual
                    bgColor: '#FFFFFF',
                    textColor: '#000000',
                    fontSize: table.size || 10,
                    fontFamily: 'Arial',
                    fontStyle: '',
                    align: 'L',
                    valign: 'middle',
                    bold: false,
                    italic: false,
                    underline: false,
                    // Bordes individuales
                    borderTop: true,
                    borderBottom: true,
                    borderLeft: true,
                    borderRight: true,
                    borderColorTop: '#000000',
                    borderColorBottom: '#000000',
                    borderColorLeft: '#000000',
                    borderColorRight: '#000000',
                    borderWidthTop: 1,
                    borderWidthBottom: 1,
                    borderWidthLeft: 1,
                    borderWidthRight: 1,
                    // Padding individual
                    paddingTop: 2,
                    paddingBottom: 2,
                    paddingLeft: 2,
                    paddingRight: 2
                });
            } else {
                // Asegurar que todas las propiedades existen
                if (cell.borderWidthTop === undefined) cell.borderWidthTop = 1;
                if (cell.borderWidthBottom === undefined) cell.borderWidthBottom = 1;
                if (cell.borderWidthLeft === undefined) cell.borderWidthLeft = 1;
                if (cell.borderWidthRight === undefined) cell.borderWidthRight = 1;
                if (cell.mergedInto === undefined) cell.mergedInto = null;
                if (cell.paddingTop === undefined) cell.paddingTop = 2;
                if (cell.paddingBottom === undefined) cell.paddingBottom = 2;
                if (cell.paddingLeft === undefined) cell.paddingLeft = 2;
                if (cell.paddingRight === undefined) cell.paddingRight = 2;
            }
        }
    }
}

// ============================================
// CERRAR Y GUARDAR EDITOR
// ============================================

function closeAdvancedTableEditor() {
    const modal = document.getElementById('advanced-table-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Limpiar estado
    tableEditorState = {
        currentTable: null,
        selectedCells: [],
        isSelectingCells: false,
        selectionStart: null,
        clipboard: null,
        history: [],
        historyIndex: -1
    };
    
    // Remover eventos de teclado
    document.removeEventListener('keydown', handleTableEditorKeyboard);
}

function saveAdvancedTable() {
    if (!tableEditorState.currentTable || !STATE.selectedElement) return;
    
    // Limpiar celdas combinadas (remover las que tienen mergedInto)
    const cleanedCells = tableEditorState.currentTable.tableData.cells.filter(cell => {
        return !cell.mergedInto;
    });
    tableEditorState.currentTable.tableData.cells = cleanedCells;
    
    // Actualizar el elemento original
    Object.assign(STATE.selectedElement, tableEditorState.currentTable);
    
    updateStats();
    updateElementsList();
    updatePropertiesPanel();
    redrawOverlay();
    
    closeAdvancedTableEditor();
    showToast('✓ Tabla guardada correctamente');
}

// ============================================
// RENDERIZADO DEL EDITOR
// ============================================

function renderTableEditor() {
    const grid = document.getElementById('table-editor-grid');
    if (!grid || !tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    grid.innerHTML = '';
    
    // Configurar grid CSS
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${table.cols}, minmax(120px, 1fr))`;
    grid.style.gridAutoRows = 'minmax(60px, auto)';
    grid.style.gap = '0';
    grid.style.border = `2px solid #cccccc`;
    grid.style.userSelect = 'none';
    grid.style.backgroundColor = '#f9f9f9';
    
    // Renderizar celdas
    for (let r = 0; r < table.rows; r++) {
        for (let c = 0; c < table.cols; c++) {
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            
            if (!cell) continue;
            
            // Si la celda está combinada en otra celda, saltarla
            if (cell.mergedInto) {
                continue;
            }
            
            const cellDiv = createCellElement(cell, r, c);
            grid.appendChild(cellDiv);
        }
    }
    
    updateSelectionInfo();
}

function createCellElement(cell, row, col) {
    const table = tableEditorState.currentTable;
    const cellDiv = document.createElement('div');
    
    cellDiv.className = 'table-editor-cell';
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;
    
    // Grid positioning con colspan y rowspan
    cellDiv.style.gridColumn = `${col + 1} / span ${cell.colspan || 1}`;
    cellDiv.style.gridRow = `${row + 1} / span ${cell.rowspan || 1}`;
    
    // Verificar si está seleccionada
    const isSelected = tableEditorState.selectedCells.some(sc => sc.row === row && sc.col === col);
    if (isSelected) {
        cellDiv.classList.add('selected');
    }
    
    // Estilos de la celda
    cellDiv.style.backgroundColor = cell.bgColor || '#FFFFFF';
    cellDiv.style.color = cell.textColor || '#000000';
    cellDiv.style.fontSize = (cell.fontSize || table.size || 10) + 'px';
    cellDiv.style.fontFamily = cell.fontFamily || 'Arial';
    cellDiv.style.fontWeight = cell.bold ? 'bold' : 'normal';
    cellDiv.style.fontStyle = cell.italic ? 'italic' : 'normal';
    cellDiv.style.textDecoration = cell.underline ? 'underline' : 'none';
    cellDiv.style.textAlign = cell.align === 'C' ? 'center' : cell.align === 'R' ? 'right' : 'left';
    cellDiv.style.verticalAlign = cell.valign || 'middle';
    
    // Padding individual
    cellDiv.style.paddingTop = `${cell.paddingTop || 4}px`;
    cellDiv.style.paddingBottom = `${cell.paddingBottom || 4}px`;
    cellDiv.style.paddingLeft = `${cell.paddingLeft || 4}px`;
    cellDiv.style.paddingRight = `${cell.paddingRight || 4}px`;
    
    cellDiv.style.position = 'relative';
    cellDiv.style.minHeight = '60px';
    cellDiv.style.display = 'flex';
    cellDiv.style.alignItems = cell.valign === 'top' ? 'flex-start' : cell.valign === 'bottom' ? 'flex-end' : 'center';
    cellDiv.style.cursor = 'cell';
    cellDiv.style.transition = 'all 0.15s ease';
    cellDiv.style.boxSizing = 'border-box';
    cellDiv.style.overflow = 'hidden';
    
    // Bordes individuales
    if (cell.borderTop) {
        cellDiv.style.borderTop = `${cell.borderWidthTop || 1}px solid ${cell.borderColorTop || '#000000'}`;
    }
    if (cell.borderBottom) {
        cellDiv.style.borderBottom = `${cell.borderWidthBottom || 1}px solid ${cell.borderColorBottom || '#000000'}`;
    }
    if (cell.borderLeft) {
        cellDiv.style.borderLeft = `${cell.borderWidthLeft || 1}px solid ${cell.borderColorLeft || '#000000'}`;
    }
    if (cell.borderRight) {
        cellDiv.style.borderRight = `${cell.borderWidthRight || 1}px solid ${cell.borderColorRight || '#000000'}`;
    }
    
    // Input para edición
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.value = cell.text || '';
    input.style.width = '100%';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.fontWeight = 'inherit';
    input.style.fontStyle = 'inherit';
    input.style.textDecoration = 'inherit';
    input.style.color = 'inherit';
    input.style.textAlign = 'inherit';
    input.style.outline = 'none';
    input.style.padding = '0';
    
    input.addEventListener('input', (e) => {
        cell.text = e.target.value;
        saveToHistory();
    });
    
    input.addEventListener('focus', () => {
        cellDiv.classList.add('editing');
    });
    
    input.addEventListener('blur', () => {
        cellDiv.classList.remove('editing');
    });
    
    cellDiv.appendChild(input);
    
    // Eventos de selección
    cellDiv.addEventListener('mousedown', (e) => {
        handleCellMouseDown(e, row, col);
    });
    
    cellDiv.addEventListener('mouseenter', (e) => {
        handleCellMouseEnter(e, row, col);
    });
    
    cellDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showCellContextMenu(e, row, col);
    });
    
    return cellDiv;
}

// ============================================
// SELECCIÓN DE CELDAS
// ============================================

function handleCellMouseDown(e, row, col) {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click: agregar/quitar de selección
        toggleCellSelection(row, col);
    } else if (e.shiftKey && tableEditorState.selectedCells.length > 0) {
        // Shift+Click: seleccionar rango
        const firstSelected = tableEditorState.selectedCells[0];
        selectCellRange(firstSelected.row, firstSelected.col, row, col);
    } else {
        // Click normal: seleccionar solo esta celda
        tableEditorState.selectedCells = [{ row, col }];
        tableEditorState.selectionStart = { row, col };
        tableEditorState.isSelectingCells = true;
    }
    
    renderTableEditor();
}

function handleCellMouseEnter(e, row, col) {
    if (tableEditorState.isSelectingCells && tableEditorState.selectionStart) {
        selectCellRange(tableEditorState.selectionStart.row, tableEditorState.selectionStart.col, row, col);
        renderTableEditor();
    }
}

function toggleCellSelection(row, col) {
    const index = tableEditorState.selectedCells.findIndex(sc => sc.row === row && sc.col === col);
    
    if (index >= 0) {
        tableEditorState.selectedCells.splice(index, 1);
    } else {
        tableEditorState.selectedCells.push({ row, col });
    }
}

function selectCellRange(startRow, startCol, endRow, endCol) {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    tableEditorState.selectedCells = [];
    
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            tableEditorState.selectedCells.push({ row: r, col: c });
        }
    }
}

function updateSelectionInfo() {
    const infoDiv = document.getElementById('table-selection-info');
    if (!infoDiv) return;
    
    const count = tableEditorState.selectedCells.length;
    
    if (count === 0) {
        infoDiv.textContent = 'Sin selección';
        infoDiv.style.color = '#888';
    } else if (count === 1) {
        const cell = tableEditorState.selectedCells[0];
        infoDiv.textContent = `Celda ${String.fromCharCode(65 + cell.col)}${cell.row + 1} seleccionada`;
        infoDiv.style.color = '#4472C4';
    } else {
        infoDiv.textContent = `${count} celdas seleccionadas`;
        infoDiv.style.color = '#4472C4';
    }
}

// ============================================
// OPERACIONES DE TABLA
// ============================================

function addTableRow() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    table.rows++;
    
    // Añadir nuevas celdas
    for (let c = 0; c < table.cols; c++) {
        table.tableData.cells.push({
            row: table.rows - 1,
            col: c,
            text: '',
            isHeader: false,
            merged: false,
            mergedInto: null,
            rowspan: 1,
            colspan: 1,
            bgColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: table.size || 10,
            fontFamily: 'Arial',
            align: 'L',
            valign: 'middle',
            bold: false,
            italic: false,
            underline: false,
            borderTop: true,
            borderBottom: true,
            borderLeft: true,
            borderRight: true,
            borderColorTop: '#000000',
            borderColorBottom: '#000000',
            borderColorLeft: '#000000',
            borderColorRight: '#000000',
            borderWidthTop: 1,
            borderWidthBottom: 1,
            borderWidthLeft: 1,
            borderWidthRight: 1,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 2,
            paddingRight: 2
        });
    }
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Fila añadida');
}

function addTableColumn() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    table.cols++;
    
    // Añadir nuevas celdas
    for (let r = 0; r < table.rows; r++) {
        table.tableData.cells.push({
            row: r,
            col: table.cols - 1,
            text: '',
            isHeader: false,
            merged: false,
            mergedInto: null,
            rowspan: 1,
            colspan: 1,
            bgColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: table.size || 10,
            fontFamily: 'Arial',
            align: 'L',
            valign: 'middle',
            bold: false,
            italic: false,
            underline: false,
            borderTop: true,
            borderBottom: true,
            borderLeft: true,
            borderRight: true,
            borderColorTop: '#000000',
            borderColorBottom: '#000000',
            borderColorLeft: '#000000',
            borderColorRight: '#000000',
            borderWidthTop: 1,
            borderWidthBottom: 1,
            borderWidthLeft: 1,
            borderWidthRight: 1,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 2,
            paddingRight: 2
        });
    }
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Columna añadida');
}

function removeTableRow() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    
    if (table.rows <= 1) {
        showToast('✗ La tabla debe tener al menos 1 fila');
        return;
    }
    
    // Remover última fila
    table.tableData.cells = table.tableData.cells.filter(cell => cell.row !== table.rows - 1);
    table.rows--;
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Fila eliminada');
}

function removeTableColumn() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    
    if (table.cols <= 1) {
        showToast('✗ La tabla debe tener al menos 1 columna');
        return;
    }
    
    // Remover última columna
    table.tableData.cells = table.tableData.cells.filter(cell => cell.col !== table.cols - 1);
    table.cols--;
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Columna eliminada');
}

// ============================================
// COMBINAR CELDAS - ARREGLADO
// ============================================

function mergeCells() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length < 2) {
        showToast('✗ Selecciona al menos 2 celdas para combinar');
        return;
    }
    
    const table = tableEditorState.currentTable;
    
    // Encontrar el rango de celdas seleccionadas
    const rows = tableEditorState.selectedCells.map(sc => sc.row);
    const cols = tableEditorState.selectedCells.map(sc => sc.col);
    
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    
    const rowspan = maxRow - minRow + 1;
    const colspan = maxCol - minCol + 1;
    
    // Verificar que las celdas seleccionadas forman un rectángulo
    if (tableEditorState.selectedCells.length !== rowspan * colspan) {
        showToast('✗ Las celdas deben formar un rectángulo para combinarlas');
        return;
    }
    
    // Obtener la celda principal (top-left)
    const mainCell = table.tableData.cells.find(c => c.row === minRow && c.col === minCol);
    
    if (!mainCell) {
        showToast('✗ Error al encontrar celda principal');
        return;
    }
    
    // Combinar el texto de todas las celdas
    let combinedText = '';
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            if (cell && cell.text) {
                combinedText += (combinedText ? ' ' : '') + cell.text;
            }
        }
    }
    
    // Configurar la celda principal
    mainCell.rowspan = rowspan;
    mainCell.colspan = colspan;
    mainCell.text = combinedText;
    mainCell.merged = false; // La principal no está combinada EN otra
    mainCell.mergedInto = null;
    
    // Marcar las demás celdas como combinadas
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            if (r === minRow && c === minCol) continue; // Skip main cell
            
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            if (cell) {
                cell.merged = true;
                cell.mergedInto = { row: minRow, col: minCol };
                cell.text = '';
                cell.rowspan = 0;
                cell.colspan = 0;
            }
        }
    }
    
    saveToHistory();
    renderTableEditor();
    showToast(`✓ Celdas combinadas (${rowspan}x${colspan})`);
}

function splitCells() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) {
        showToast('✗ Selecciona una celda combinada para separar');
        return;
    }
    
    const table = tableEditorState.currentTable;
    const { row, col } = tableEditorState.selectedCells[0];
    const mainCell = table.tableData.cells.find(c => c.row === row && c.col === col);
    
    if (!mainCell || (mainCell.rowspan === 1 && mainCell.colspan === 1)) {
        showToast('✗ La celda no está combinada');
        return;
    }
    
    // Restablecer las celdas combinadas
    for (let r = row; r < row + mainCell.rowspan; r++) {
        for (let c = col; c < col + mainCell.colspan; c++) {
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            if (cell) {
                cell.merged = false;
                cell.mergedInto = null;
                cell.rowspan = 1;
                cell.colspan = 1;
            }
        }
    }
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Celdas separadas');
}

// ============================================
// FORMATO DE CELDAS
// ============================================

function toggleHeaderCell() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.isHeader = !cell.isHeader;
            cell.bgColor = cell.isHeader ? (table.headerColor || '#4472C4') : '#FFFFFF';
            cell.bold = cell.isHeader;
            cell.textColor = cell.isHeader ? '#FFFFFF' : '#000000';
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Estilo de encabezado aplicado');
}

function setCellBackgroundColor(color) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.bgColor = color;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Color de fondo aplicado');
}

function setCellTextColor(color) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.textColor = color;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Color de texto aplicado');
}

function setCellFontSize(size) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.fontSize = parseInt(size);
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast(`✓ Tamaño de fuente: ${size}px`);
}

function setCellFontFamily(fontFamily) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.fontFamily = fontFamily;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast(`✓ Fuente: ${fontFamily}`);
}

function toggleCellBold() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.bold = !cell.bold;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Negrita aplicada');
}

function toggleCellItalic() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.italic = !cell.italic;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Cursiva aplicada');
}

function toggleCellUnderline() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.underline = !cell.underline;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Subrayado aplicado');
}

function setCellAlignment(align) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.align = align;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Alineación aplicada');
}

function setCellVerticalAlignment(valign) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.valign = valign;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Alineación vertical aplicada');
}

// ============================================
// BORDES DE CELDAS
// ============================================

function setCellBorderColor(side, color) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            if (side === 'all' || side === 'top') cell.borderColorTop = color;
            if (side === 'all' || side === 'bottom') cell.borderColorBottom = color;
            if (side === 'all' || side === 'left') cell.borderColorLeft = color;
            if (side === 'all' || side === 'right') cell.borderColorRight = color;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Color de borde aplicado');
}

function setCellBorderWidth(side, width) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    const w = parseFloat(width);
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            if (side === 'all' || side === 'top') cell.borderWidthTop = w;
            if (side === 'all' || side === 'bottom') cell.borderWidthBottom = w;
            if (side === 'all' || side === 'left') cell.borderWidthLeft = w;
            if (side === 'all' || side === 'right') cell.borderWidthRight = w;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Ancho de borde aplicado');
}

function toggleCellBorder(side) {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            if (side === 'all' || side === 'top') cell.borderTop = !cell.borderTop;
            if (side === 'all' || side === 'bottom') cell.borderBottom = !cell.borderBottom;
            if (side === 'all' || side === 'left') cell.borderLeft = !cell.borderLeft;
            if (side === 'all' || side === 'right') cell.borderRight = !cell.borderRight;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Borde activado/desactivado');
}

// ============================================
// EXPORTAR A DIFERENTES FORMATOS
// ============================================

function exportToExcel() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    let csv = '';
    
    for (let r = 0; r < table.rows; r++) {
        let row = [];
        for (let c = 0; c < table.cols; c++) {
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            row.push(cell && cell.text ? `"${cell.text}"` : '""');
        }
        csv += row.join(',') + '\n';
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tabla.csv';
    link.click();
    
    showToast('✓ Tabla exportada a CSV (Excel)');
}

function exportToWord() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    let html = '<table border="1" style="border-collapse: collapse; width: 100%;">\n';
    
    for (let r = 0; r < table.rows; r++) {
        html += '  <tr>\n';
        for (let c = 0; c < table.cols; c++) {
            const cell = table.tableData.cells.find(cell => cell.row === r && cell.col === c);
            
            if (!cell || cell.mergedInto) continue;
            
            const colspan = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
            const rowspan = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
            const bgColor = cell.bgColor !== '#FFFFFF' ? ` bgcolor="${cell.bgColor}"` : '';
            const style = `style="padding: 5px; text-align: ${cell.align === 'C' ? 'center' : cell.align === 'R' ? 'right' : 'left'}; color: ${cell.textColor}; font-size: ${cell.fontSize}px; font-weight: ${cell.bold ? 'bold' : 'normal'}; font-style: ${cell.italic ? 'italic' : 'normal'};"`;
            
            html += `    <td${colspan}${rowspan}${bgColor} ${style}>${cell.text || ''}</td>\n`;
        }
        html += '  </tr>\n';
    }
    html += '</table>';
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tabla.html';
    link.click();
    
    showToast('✓ Tabla exportada a HTML (Word)');
}

function exportToCanva() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    
    const canvaData = {
        type: 'table',
        rows: table.rows,
        cols: table.cols,
        cells: table.tableData.cells.map(cell => ({
            row: cell.row,
            col: cell.col,
            text: cell.text,
            bgColor: cell.bgColor,
            textColor: cell.textColor,
            fontSize: cell.fontSize,
            fontFamily: cell.fontFamily,
            bold: cell.bold,
            italic: cell.italic,
            underline: cell.underline,
            align: cell.align,
            rowspan: cell.rowspan,
            colspan: cell.colspan,
            mergedInto: cell.mergedInto
        }))
    };
    
    const json = JSON.stringify(canvaData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tabla-canva.json';
    link.click();
    
    showToast('✓ Tabla exportada a formato Canva (JSON)');
}

// ============================================
// COPIAR, PEGAR, CORTAR
// ============================================

function copyCells() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) {
        showToast('✗ Selecciona celdas para copiar');
        return;
    }
    
    const table = tableEditorState.currentTable;
    tableEditorState.clipboard = [];
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            tableEditorState.clipboard.push(JSON.parse(JSON.stringify(cell)));
        }
    });
    
    showToast(`✓ ${tableEditorState.clipboard.length} celdas copiadas`);
}

function pasteCells() {
    if (!tableEditorState.clipboard || tableEditorState.clipboard.length === 0) {
        showToast('✗ Clipboard vacío');
        return;
    }
    
    if (tableEditorState.selectedCells.length === 0) {
        showToast('✗ Selecciona una celda destino');
        return;
    }
    
    const { row, col } = tableEditorState.selectedCells[0];
    const table = tableEditorState.currentTable;
    
    tableEditorState.clipboard.forEach((copiedCell) => {
        const targetRow = row + (copiedCell.row - tableEditorState.clipboard[0].row);
        const targetCol = col + (copiedCell.col - tableEditorState.clipboard[0].col);
        
        if (targetRow < table.rows && targetCol < table.cols) {
            const targetCell = table.tableData.cells.find(c => c.row === targetRow && c.col === targetCol);
            if (targetCell) {
                // Copiar todas las propiedades excepto row y col
                Object.keys(copiedCell).forEach(key => {
                    if (key !== 'row' && key !== 'col') {
                        targetCell[key] = copiedCell[key];
                    }
                });
            }
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Celdas pegadas');
}

function cutCells() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) {
        showToast('✗ Selecciona celdas para cortar');
        return;
    }
    
    copyCells();
    clearCellContent();
    showToast('✓ Celdas cortadas');
}

// ============================================
// HISTORIAL (DESHACER/REHACER)
// ============================================

function saveToHistory() {
    if (!tableEditorState.currentTable) return;
    
    // Limitar historial a 50 estados
    if (tableEditorState.history.length > 50) {
        tableEditorState.history.shift();
        tableEditorState.historyIndex--;
    }
    
    // Si estamos en medio del historial, eliminar estados futuros
    if (tableEditorState.historyIndex < tableEditorState.history.length - 1) {
        tableEditorState.history = tableEditorState.history.slice(0, tableEditorState.historyIndex + 1);
    }
    
    const state = JSON.parse(JSON.stringify(tableEditorState.currentTable));
    tableEditorState.history.push(state);
    tableEditorState.historyIndex = tableEditorState.history.length - 1;
}

function undo() {
    if (tableEditorState.historyIndex > 0) {
        tableEditorState.historyIndex--;
        tableEditorState.currentTable = JSON.parse(JSON.stringify(tableEditorState.history[tableEditorState.historyIndex]));
        renderTableEditor();
        showToast('↶ Deshacer');
    } else {
        showToast('✗ No hay más acciones para deshacer');
    }
}

function redo() {
    if (tableEditorState.historyIndex < tableEditorState.history.length - 1) {
        tableEditorState.historyIndex++;
        tableEditorState.currentTable = JSON.parse(JSON.stringify(tableEditorState.history[tableEditorState.historyIndex]));
        renderTableEditor();
        showToast('↷ Rehacer');
    } else {
        showToast('✗ No hay más acciones para rehacer');
    }
}

// ============================================
// CONFIGURACIÓN GLOBAL DE LA TABLA
// ============================================

function updateTableFontSize(size) {
    if (!tableEditorState.currentTable) return;
    
    tableEditorState.currentTable.size = parseInt(size);
    saveToHistory();
    renderTableEditor();
    showToast('✓ Tamaño de fuente global actualizado');
}

function updateTableHeaderColor(color) {
    if (!tableEditorState.currentTable) return;
    
    tableEditorState.currentTable.headerColor = color;
    
    // Actualizar todas las celdas de encabezado
    tableEditorState.currentTable.tableData.cells.forEach(cell => {
        if (cell.isHeader) {
            cell.bgColor = color;
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Color de encabezado actualizado');
}

function updateTableBorderColor(color) {
    if (!tableEditorState.currentTable) return;
    
    tableEditorState.currentTable.borderColor = color;
    saveToHistory();
    renderTableEditor();
    showToast('✓ Color de borde actualizado');
}

function updateTableBorderWidth(width) {
    if (!tableEditorState.currentTable) return;
    
    tableEditorState.currentTable.borderWidth = parseFloat(width);
    saveToHistory();
    renderTableEditor();
    showToast('✓ Ancho de borde actualizado');
}

function updateTableCellPadding(padding) {
    if (!tableEditorState.currentTable) return;
    
    tableEditorState.currentTable.cellPadding = parseInt(padding);
    saveToHistory();
    renderTableEditor();
    showToast('✓ Relleno de celda actualizado');
}

// ============================================
// UTILIDADES
// ============================================

function selectAllCells() {
    if (!tableEditorState.currentTable) return;
    
    const table = tableEditorState.currentTable;
    tableEditorState.selectedCells = [];
    
    for (let r = 0; r < table.rows; r++) {
        for (let c = 0; c < table.cols; c++) {
            tableEditorState.selectedCells.push({ row: r, col: c });
        }
    }
    
    renderTableEditor();
    showToast('✓ Todas las celdas seleccionadas');
}

function deselectAllCells() {
    tableEditorState.selectedCells = [];
    renderTableEditor();
    updateSelectionInfo();
}

function clearCellContent() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.text = '';
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Contenido eliminado');
}

function clearCellFormatting() {
    if (!tableEditorState.currentTable || tableEditorState.selectedCells.length === 0) return;
    
    const table = tableEditorState.currentTable;
    
    tableEditorState.selectedCells.forEach(sc => {
        const cell = table.tableData.cells.find(c => c.row === sc.row && c.col === sc.col);
        if (cell) {
            cell.bgColor = '#FFFFFF';
            cell.textColor = '#000000';
            cell.fontSize = table.size || 10;
            cell.fontFamily = 'Arial';
            cell.bold = false;
            cell.italic = false;
            cell.underline = false;
            cell.align = 'L';
            cell.valign = 'middle';
        }
    });
    
    saveToHistory();
    renderTableEditor();
    showToast('✓ Formato eliminado');
}

// ============================================
// MENÚ CONTEXTUAL
// ============================================

function showCellContextMenu(e, row, col) {
    // Aquí puedes implementar un menú contextual personalizado
    // Por ahora solo selecciona la celda
    tableEditorState.selectedCells = [{ row, col }];
    renderTableEditor();
}

// ============================================
// ATAJOS DE TECLADO
// ============================================

function setupTableEditorKeyboardShortcuts() {
    document.addEventListener('keydown', handleTableEditorKeyboard);
    
    // Prevenir salida accidental al terminar selección
    document.addEventListener('mouseup', () => {
        tableEditorState.isSelectingCells = false;
    });
}

function handleTableEditorKeyboard(e) {
    // Solo si el modal está abierto
    const modal = document.getElementById('advanced-table-modal');
    if (!modal || !modal.classList.contains('active')) return;
    
    // No interceptar si estamos escribiendo en un input
    if (e.target.tagName === 'INPUT' && e.target.classList.contains('cell-input')) {
        return;
    }
    
    // Ctrl/Cmd + C: Copiar
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyCells();
    }
    
    // Ctrl/Cmd + V: Pegar
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteCells();
    }
    
    // Ctrl/Cmd + X: Cortar
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        cutCells();
    }
    
    // Ctrl/Cmd + A: Seleccionar todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllCells();
    }
    
    // Delete o Backspace: Limpiar contenido
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        clearCellContent();
    }
    
    // Ctrl/Cmd + B: Negrita
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleCellBold();
    }
    
    // Ctrl/Cmd + I: Cursiva
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        toggleCellItalic();
    }
    
    // Ctrl/Cmd + U: Subrayado
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        toggleCellUnderline();
    }
    
    // Ctrl/Cmd + Z: Deshacer
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    
    // Ctrl/Cmd + Shift + Z o Ctrl/Cmd + Y: Rehacer
    if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
    }
    
    // Escape: Deseleccionar
    if (e.key === 'Escape') {
        e.preventDefault();
        deselectAllCells();
    }
}

// ============================================
// FUNCIÓN MEJORADA PARA ESCRIBIR EN CELDAS
// ============================================
// Reemplaza la función createCellElement existente con esta versión mejorada

function createCellElement(cell, row, col) {
    const table = tableEditorState.currentTable;
    const cellDiv = document.createElement('div');
    
    cellDiv.className = 'table-editor-cell';
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;
    
    // Grid positioning con colspan y rowspan
    cellDiv.style.gridColumn = `${col + 1} / span ${cell.colspan || 1}`;
    cellDiv.style.gridRow = `${row + 1} / span ${cell.rowspan || 1}`;
    
    // Verificar si está seleccionada
    const isSelected = tableEditorState.selectedCells.some(sc => sc.row === row && sc.col === col);
    if (isSelected) {
        cellDiv.classList.add('selected');
    }
    
    // Estilos de la celda
    cellDiv.style.backgroundColor = cell.bgColor || '#FFFFFF';
    cellDiv.style.color = cell.textColor || '#000000';
    cellDiv.style.fontSize = (cell.fontSize || table.size || 10) + 'px';
    cellDiv.style.fontFamily = cell.fontFamily || 'Arial';
    cellDiv.style.fontWeight = cell.bold ? 'bold' : 'normal';
    cellDiv.style.fontStyle = cell.italic ? 'italic' : 'normal';
    cellDiv.style.textDecoration = cell.underline ? 'underline' : 'none';
    cellDiv.style.textAlign = cell.align === 'C' ? 'center' : cell.align === 'R' ? 'right' : 'left';
    cellDiv.style.verticalAlign = cell.valign || 'middle';
    
    // Padding individual
    cellDiv.style.paddingTop = `${cell.paddingTop || 4}px`;
    cellDiv.style.paddingBottom = `${cell.paddingBottom || 4}px`;
    cellDiv.style.paddingLeft = `${cell.paddingLeft || 4}px`;
    cellDiv.style.paddingRight = `${cell.paddingRight || 4}px`;
    
    cellDiv.style.position = 'relative';
    cellDiv.style.minHeight = '60px';
    cellDiv.style.display = 'flex';
    cellDiv.style.alignItems = cell.valign === 'top' ? 'flex-start' : cell.valign === 'bottom' ? 'flex-end' : 'center';
    cellDiv.style.cursor = 'text'; // ← CAMBIO: cursor de texto
    cellDiv.style.transition = 'all 0.15s ease';
    cellDiv.style.boxSizing = 'border-box';
    cellDiv.style.overflow = 'hidden';
    
    // Bordes individuales
    if (cell.borderTop) {
        cellDiv.style.borderTop = `${cell.borderWidthTop || 1}px solid ${cell.borderColorTop || '#000000'}`;
    }
    if (cell.borderBottom) {
        cellDiv.style.borderBottom = `${cell.borderWidthBottom || 1}px solid ${cell.borderColorBottom || '#000000'}`;
    }
    if (cell.borderLeft) {
        cellDiv.style.borderLeft = `${cell.borderWidthLeft || 1}px solid ${cell.borderColorLeft || '#000000'}`;
    }
    if (cell.borderRight) {
        cellDiv.style.borderRight = `${cell.borderWidthRight || 1}px solid ${cell.borderColorRight || '#000000'}`;
    }
    
    // ============================================
    // MEJORA: INPUT EDITABLE MEJORADO
    // ============================================
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.value = cell.text || '';
    input.style.width = '100%';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.fontWeight = 'inherit';
    input.style.fontStyle = 'inherit';
    input.style.textDecoration = 'inherit';
    input.style.color = 'inherit';
    input.style.textAlign = 'inherit';
    input.style.outline = 'none';
    input.style.padding = '0';
    input.style.cursor = 'text'; // ← CAMBIO: cursor de texto
    input.style.pointerEvents = 'auto'; // ← CAMBIO: siempre activo para escribir
    
    // Guardar referencia al input en el dataset
    cellDiv.dataset.hasInput = 'true';
    
    // ============================================
    // EVENTO: Cuando escribes en la celda
    // ============================================
    input.addEventListener('input', (e) => {
        cell.text = e.target.value;
        // Guardar en historial con debounce para no saturar
        clearTimeout(cell.saveTimeout);
        cell.saveTimeout = setTimeout(() => {
            saveToHistory();
        }, 500); // Guarda 500ms después de dejar de escribir
    });
    
    // ============================================
    // EVENTO: Cuando haces focus en la celda
    // ============================================
    input.addEventListener('focus', () => {
        cellDiv.classList.add('editing');
        // Seleccionar la celda automáticamente
        if (!tableEditorState.selectedCells.some(sc => sc.row === row && sc.col === col)) {
            tableEditorState.selectedCells = [{ row, col }];
            renderTableEditor();
        }
    });
    
    // ============================================
    // EVENTO: Cuando pierdes el focus
    // ============================================
    input.addEventListener('blur', () => {
        cellDiv.classList.remove('editing');
        // Guardar inmediatamente al perder focus
        if (cell.saveTimeout) {
            clearTimeout(cell.saveTimeout);
        }
        saveToHistory();
    });
    
    // ============================================
    // EVENTO: Navegación con teclas
    // ============================================
    input.addEventListener('keydown', (e) => {
        // Enter: Mover a la celda de abajo
        if (e.key === 'Enter') {
            e.preventDefault();
            moveToCellBelow(row, col);
        }
        // Tab: Mover a la celda de la derecha
        else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            moveToCellRight(row, col);
        }
        // Shift+Tab: Mover a la celda de la izquierda
        else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            moveToCellLeft(row, col);
        }
        // Flecha arriba: Mover a celda de arriba
        else if (e.key === 'ArrowUp' && !e.altKey) {
            e.preventDefault();
            moveToCellAbove(row, col);
        }
        // Flecha abajo: Mover a celda de abajo
        else if (e.key === 'ArrowDown' && !e.altKey) {
            e.preventDefault();
            moveToCellBelow(row, col);
        }
        // Flecha izquierda: Si estás al inicio del texto, mover a celda anterior
        else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
            e.preventDefault();
            moveToCellLeft(row, col);
        }
        // Flecha derecha: Si estás al final del texto, mover a celda siguiente
        else if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
            e.preventDefault();
            moveToCellRight(row, col);
        }
    });
    
    cellDiv.appendChild(input);
    
    // ============================================
    // EVENTO: Click en la celda - MEJORADO
    // ============================================
    cellDiv.addEventListener('mousedown', (e) => {
        // Si haces click en el input, no hacer nada más
        if (e.target === input) {
            return;
        }
        
        // Si haces click en la celda pero no en el input, dar focus al input
        e.preventDefault();
        handleCellMouseDown(e, row, col);
        
        // Dar focus al input después de un pequeño delay
        setTimeout(() => {
            input.focus();
        }, 10);
    });
    
    // Doble click para editar directamente
    cellDiv.addEventListener('dblclick', (e) => {
        e.preventDefault();
        input.focus();
        input.select(); // Seleccionar todo el texto
    });
    
    cellDiv.addEventListener('mouseenter', (e) => {
        handleCellMouseEnter(e, row, col);
    });
    
    cellDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showCellContextMenu(e, row, col);
    });
    
    return cellDiv;
}

// ============================================
// FUNCIONES DE NAVEGACIÓN ENTRE CELDAS
// ============================================

function moveToCellBelow(currentRow, currentCol) {
    const table = tableEditorState.currentTable;
    const nextRow = currentRow + 1;
    
    if (nextRow < table.rows) {
        focusCellInput(nextRow, currentCol);
    }
}

function moveToCellAbove(currentRow, currentCol) {
    const nextRow = currentRow - 1;
    
    if (nextRow >= 0) {
        focusCellInput(nextRow, currentCol);
    }
}

function moveToCellRight(currentRow, currentCol) {
    const table = tableEditorState.currentTable;
    const nextCol = currentCol + 1;
    
    if (nextCol < table.cols) {
        focusCellInput(currentRow, nextCol);
    } else if (currentRow + 1 < table.rows) {
        // Si llegamos al final de la fila, ir a la primera celda de la siguiente fila
        focusCellInput(currentRow + 1, 0);
    }
}

function moveToCellLeft(currentRow, currentCol) {
    const table = tableEditorState.currentTable;
    const nextCol = currentCol - 1;
    
    if (nextCol >= 0) {
        focusCellInput(currentRow, nextCol);
    } else if (currentRow - 1 >= 0) {
        // Si estamos en la primera columna, ir a la última celda de la fila anterior
        focusCellInput(currentRow - 1, table.cols - 1);
    }
}

function focusCellInput(row, col) {
    // Encontrar el input de la celda
    const cellDiv = document.querySelector(`.table-editor-cell[data-row="${row}"][data-col="${col}"]`);
    
    if (cellDiv) {
        const input = cellDiv.querySelector('.cell-input');
        if (input) {
            // Seleccionar la celda
            tableEditorState.selectedCells = [{ row, col }];
            renderTableEditor();
            
            // Dar focus al input
            setTimeout(() => {
                input.focus();
            }, 50);
        }
    }
}

// ============================================
// FUNCIÓN PARA HACER CLIC Y EMPEZAR A ESCRIBIR
// ============================================

function enableClickToWrite() {
    // Esta función permite que al hacer un solo click ya puedas escribir
    const grid = document.getElementById('table-editor-grid');
    if (!grid) return;
    
    // Agregar listener global para clicks
    grid.addEventListener('click', (e) => {
        const cellDiv = e.target.closest('.table-editor-cell');
        if (cellDiv) {
            const input = cellDiv.querySelector('.cell-input');
            if (input && e.target !== input) {
                input.focus();
            }
        }
    });
}



console.log('✅ Función de escritura en celdas mejorada - Cargada');

console.log('%c✨ Editor Ultra Profesional de Tablas v3.0 - Completamente Funcional', 'color: #00ff00; font-size: 16px; font-weight: bold;');
console.log('%c Funciones: Combinar celdas ✓ | Colores ✓ | Fuentes ✓ | Bordes ✓ | Exportar ✓', 'color: #4ECDC4; font-size: 12px;');
