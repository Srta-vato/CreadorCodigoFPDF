// ============================================
// CODE-GENERATOR.JS - Generación de Código FPDF
// VERSIÓN MEJORADA: Con soporte para grupos horizontales
// ============================================

function showCodeModal() {
    generateFPDFCode();
    const modal = document.getElementById('code-modal');
    if (modal) modal.classList.add('active');
}

function hideCodeModal() {
    const modal = document.getElementById('code-modal');
    if (modal) modal.classList.remove('active');
}

function generateFPDFCode() {
    let code = `<?php
require('fpdf/fpdf.php');

class PDF extends FPDF {

    function Header() {
${generateHeaderCode()}
    }

    function Footer() {
${generateFooterCode()}
    }
}

$pdf = new PDF();

// 🔹 CONFIGURACIÓN GLOBAL DEL DOCUMENTO
$pdf->SetMargins(15, 18, 15); // Márgenes izquierdo, superior, derecho
$pdf->SetAutoPageBreak(true, 25); // Salto automático con margen inferior
$pdf->SetFont('Arial', '', 10);

$pdf->AddPage();

$leftMargin = 20;
$rightMargin = 20;
$pageWidth = $pdf->GetPageWidth();
$usableWidth = $pageWidth - $leftMargin - $rightMargin;
$pdf->Ln(10); 


// 🔹 CUERPO DEL DOCUMENTO (FLUJO JERÁRQUICO)
${generateBodyCode()}

$pdf->Output('D', 'documento_generado.pdf');
?>`;

    const output = document.getElementById('code-output');
    if (output) output.textContent = code;

    showToast('✓ Código FPDF generado');
}

// 🆕 FUNCIÓN MEJORADA: Genera código del header con soporte para grupos horizontales
function generateHeaderCode() {
    let code = '';
    const ids = STATE.documentStructure.header || [];

    if (ids.length === 0) {
        return `        // Sin encabezado\n`;
    }

    code += `        // ===== ENCABEZADO (CON GRUPOS HORIZONTALES) =====\n`;
    code += `        $leftMargin = 10;\n`;
    code += `        $rightMargin = 10;\n`;
    code += `        $pageWidth = $this->GetPageWidth();\n`;
    code += `        $usableWidth = $pageWidth - $leftMargin - $rightMargin;\n\n`;

    // Obtener elementos
    const elements = [];
    ids.forEach(id => {
        let el = null;
        for (let p in STATE.elements) {
            el = STATE.elements[p].find(e => e.id === id);
            if (el) break;
        }
        if (el) elements.push(el);
    });

    // Agrupar por groupId
    const processedGroups = new Set();
    
    elements.forEach((el, index) => {
        // Si tiene grupo y no ha sido procesado
        if (el.groupId && !processedGroups.has(el.groupId)) {
            processedGroups.add(el.groupId);
            const groupElements = elements.filter(e => e.groupId === el.groupId)
                                          .sort((a, b) => a.groupOrder - b.groupOrder);
            
            code += `        // === GRUPO HORIZONTAL (${groupElements.length} elementos) ===\n`;
            code += `        $groupStartY = $this->GetY();\n`;
            code += `        $groupMaxHeight = 0;\n\n`;
            
            groupElements.forEach((groupEl, gIndex) => {
                code += `        // Elemento ${gIndex + 1} del grupo: ${groupEl.type}\n`;
                code += generateHeaderGroupElementCode(groupEl);
            });
            
            code += `        // Avanzar Y después del grupo completo\n`;
            code += `        $this->SetY($groupStartY + $groupMaxHeight + 4);\n\n`;
            
        } else if (!el.groupId) {
            // Elemento sin grupo - flujo normal
            code += `        // Elemento: ${el.type.toUpperCase()}\n`;
            code += generateHeaderNormalElementCode(el);
        }
    });

    return code;
}

// FUNCIÓN: Genera código para elementos dentro de un grupo horizontal
function generateHeaderGroupElementCode(el) {
    // Calcular posiciones relativas
    const x = (el.x * PIXELS_TO_MM).toFixed(2);
    const y = (el.y * PIXELS_TO_MM).toFixed(2); // Se calcula pero antes no se usaba
    const w = (el.w * PIXELS_TO_MM).toFixed(2);
    const h = (el.h * PIXELS_TO_MM).toFixed(2);
    
    let code = '';
    
    switch (el.type) {
        case 'rect':
            code += `        $this->SetLineWidth(${el.thickness || 1});\n`;
            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }
            if (el.fill) {
                const rgb = hexToRgb(el.fillColor || '#ffffff');
                code += `        $this->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
                // CORRECCIÓN: Se suma ${y} a $groupStartY
                code += `        $this->Rect(${x}, $groupStartY + ${y}, ${w}, ${h}, 'FD');\n`;
            } else {
                // CORRECCIÓN: Se suma ${y} a $groupStartY
                code += `        $this->Rect(${x}, $groupStartY + ${y}, ${w}, ${h});\n`;
            }
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetDrawColor(0, 0, 0);\n`;
            }
            // Se usa la altura relativa + la posición Y para calcular la altura total del grupo
            code += `        $groupMaxHeight = max($groupMaxHeight, ${y} + ${h});\n\n`;
            break;
            
        case 'image':
            code += `        if (file_exists('${el.path || 'imagen.jpg'}')) {\n`;
            // CORRECCIÓN: Se suma ${y} a $groupStartY
            code += `            $this->Image('${el.path || 'imagen.jpg'}', ${x}, $groupStartY + ${y}, ${w}, ${h});\n`;
            code += `            $groupMaxHeight = max($groupMaxHeight, ${y} + ${h});\n`;
            code += `        }\n\n`;
            break;
            
        case 'text':
            const text = el.text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const lineHeight = (el.size * 0.45).toFixed(2);
            
            code += `        $this->SetFont('${el.font}', '${el.style}', ${el.size});\n`;
            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }
            // CORRECCIÓN: SetXY ahora usa la posición X correcta y suma Y al inicio del grupo
            code += `        $this->SetXY(${x}, $groupStartY + ${y});\n`;
            code += `        $this->Cell(${w}, ${lineHeight}, utf8_decode('${text}'), 0, 0, '${el.align}');\n`;
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetTextColor(0, 0, 0);\n`;
            }
            code += `        $groupMaxHeight = max($groupMaxHeight, ${y} + ${lineHeight});\n\n`;
            break;
            
        case 'line':
            code += `        $this->SetLineWidth(${el.thickness || 1});\n`;
            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }
            // CORRECCIÓN: La línea necesita sumar ${y} tanto en el punto de inicio como en el final verticalmente
            const endX = (el.x + el.w) * PIXELS_TO_MM;
            code += `        $this->Line(${x}, $groupStartY + ${y}, ${endX}, $groupStartY + ${y});\n`;
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetDrawColor(0, 0, 0);\n`;
            }
            code += `        $groupMaxHeight = max($groupMaxHeight, ${y} + 1);\n\n`;
            break;
    }
    
    return code;
}

// 🆕 NUEVA FUNCIÓN: Genera código para elementos normales (no agrupados) del header
function generateHeaderNormalElementCode(el) {
    let code = '';
    
    switch (el.type) {
        case 'text': {
            const text = el.text
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\r?\n/g, "\n");

            const fontSize = el.size;
            const lineHeight = (fontSize * 0.45).toFixed(2);

            code += `        $this->SetFont('${el.font}', '${el.style}', ${fontSize});\n`;

            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }

            const border = el.border || '0';
            const fill = (el.bgColor && el.bgColor !== 'transparent') ? 'true' : 'false';
            
            if (el.bgColor && el.bgColor !== 'transparent') {
                const rgb = hexToRgb(el.bgColor);
                code += `        $this->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }

            if (el.isMultiCell) {
                code += `        $this->SetX($leftMargin);\n`;
                code += `        $this->MultiCell($usableWidth, ${lineHeight}, utf8_decode('${text}'), '${border}', '${el.align}', ${fill});\n`;
                code += `        $this->Ln(4);\n`;
            } else {
                code += `        $this->SetX($leftMargin);\n`;
                code += `        $this->Cell($usableWidth, ${lineHeight}, utf8_decode('${text}'), '${border}', 1, '${el.align}', ${fill});\n`;
            }
            
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetTextColor(0, 0, 0);\n`;
            }
            if (el.bgColor && el.bgColor !== 'transparent') {
                code += `        $this->SetFillColor(255, 255, 255);\n`;
            }
            
            code += `\n`;
            break;
        }

        case 'image': {
            const w = ((el.width || el.w || 50) * PIXELS_TO_MM).toFixed(2);
            const h = ((el.height || el.h || 30) * PIXELS_TO_MM).toFixed(2);

            code += `        if (file_exists('${el.imagePath || el.path || 'logo.jpg'}')) {\n`;
            code += `            $currentY = $this->GetY();\n`;
            code += `            $this->Image('${el.imagePath || el.path || 'logo.jpg'}', $leftMargin, $currentY, ${w}, ${h});\n`;
            code += `            $this->SetY($currentY + ${h} + 4);\n`;
            code += `        }\n\n`;
            break;
        }

        case 'line': {
            const thickness = el.thickness || 0.2;

            code += `        $currentY = $this->GetY();\n`;
            code += `        $this->SetLineWidth(${thickness});\n`;
            
            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }
            
            code += `        $this->Line($leftMargin, $currentY, $pageWidth - $rightMargin, $currentY);\n`;
            
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetDrawColor(0, 0, 0);\n`;
            }
            
            code += `        $this->SetY($currentY + 4);\n\n`;
            break;
        }

        case 'rect': {
            const h = ((el.height || el.h || 10) * PIXELS_TO_MM).toFixed(2);
            const thickness = el.thickness || 0.2;

            code += `        $currentY = $this->GetY();\n`;
            code += `        $this->SetLineWidth(${thickness});\n`;

            if (el.color && el.color !== '#000000') {
                const rgb = hexToRgb(el.color);
                code += `        $this->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
            }

            if (el.fill) {
                const rgb = hexToRgb(el.fillColor || '#ffffff');
                code += `        $this->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
                code += `        $this->Rect($leftMargin, $currentY, $usableWidth, ${h}, 'FD');\n`;
            } else {
                code += `        $this->Rect($leftMargin, $currentY, $usableWidth, ${h});\n`;
            }
            
            if (el.color && el.color !== '#000000') {
                code += `        $this->SetDrawColor(0, 0, 0);\n`;
            }
            
            code += `        $this->SetY($currentY + ${h} + 4);\n\n`;
            break;
        }

        case 'table': {
            code += generateHeaderTableCode(el, '        ');
            break;
        }
    }
    
    return code;
}

function generateHeaderTableCode(el, indent) {
    let code = '';
    
    code += `${indent}// Tabla ${el.rows}x${el.cols} en Header\n`;
    code += `${indent}$this->SetFont('${el.font || 'Arial'}', '', ${el.size || 10});\n`;
    
    if (el.textColor && el.textColor !== '#000000') {
        const rgb = hexToRgb(el.textColor);
        code += `${indent}$this->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }

    code += `${indent}$cellWidth = $usableWidth / ${el.cols};\n`;
    const cellHeight = (((el.height || el.h || 0) / el.rows) * PIXELS_TO_MM).toFixed(2);

    const cells = el.tableData?.cells || el.data || [];
    
    for (let r = 0; r < el.rows; r++) {
        code += `${indent}$this->SetX($leftMargin);\n`;
        
        for (let c = 0; c < el.cols; c++) {
            let cell = null;
            if (Array.isArray(cells)) {
                if (cells[r] && cells[r][c]) {
                    cell = cells[r][c];
                } else {
                    cell = cells.find(cell => cell.row === r && cell.col === c);
                }
            }
            
            if (!cell || (cell.merged && (cell.rowspan === 0 || cell.colspan === 0))) continue;
            
            const txt = (cell.text || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            
            let w = `$cellWidth`;
            let h = cellHeight;
            
            if (cell.merged && (cell.rowspan > 1 || cell.colspan > 1)) {
                w = `($cellWidth * ${cell.colspan})`;
                h = (parseFloat(cellHeight) * cell.rowspan).toFixed(2);
            }
            
            if (cell.isHeader) {
                const headerRgb = hexToRgb(el.headerColor || '#d3d3d3');
                code += `${indent}$this->SetFont('${el.font || 'Arial'}', 'B', ${el.size || 10});\n`;
                code += `${indent}$this->SetFillColor(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b});\n`;
                code += `${indent}$this->Cell(${w}, ${h}, utf8_decode('${txt}'), 1, 0, 'C', true);\n`;
                code += `${indent}$this->SetFont('${el.font || 'Arial'}', '', ${el.size || 10});\n`;
                code += `${indent}$this->SetFillColor(255, 255, 255);\n`;
            } else {
                code += `${indent}$this->Cell(${w}, ${h}, utf8_decode('${txt}'), 1, 0, 'L');\n`;
            }
        }
        
        code += `${indent}$this->Ln();\n`;
    }

    if (el.textColor && el.textColor !== '#000000') {
        code += `${indent}$this->SetTextColor(0, 0, 0);\n`;
    }
    
    code += `${indent}$this->Ln(4);\n\n`;

    return code;
}

function generateFooterCode() {
    let code = '';
    const ids = STATE.documentStructure.footer || [];

    if (ids.length === 0) {
        return `        // Sin pie de página\n`;
    }

    code += `        // ===== PIE DE PÁGINA (FLUJO JERÁRQUICO) =====\n`;
    code += `        $leftMargin = 10;\n`;
    code += `        $rightMargin = 10;\n`;
    code += `        $pageWidth = $this->GetPageWidth();\n`;
    code += `        $usableWidth = $pageWidth - $leftMargin - $rightMargin;\n`;
    code += `        $this->SetY(-25); // Posicionar cerca del final\n\n`;

    ids.forEach((id, index) => {
        let el = null;

        for (let p in STATE.elements) {
            el = STATE.elements[p].find(e => e.id === id);
            if (el) break;
        }

        if (!el) return;

        code += `        // Elemento ${index + 1} del Footer: ${el.type.toUpperCase()}\n`;

        switch (el.type) {

            case 'text': {
                const text = el.text
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(/\r?\n/g, " ");

                const fontSize = el.size;
                const lineHeight = (fontSize * 0.45).toFixed(2);

                code += `        $this->SetFont('${el.font}', '${el.style}', ${fontSize});\n`;

                if (el.color && el.color !== '#000000') {
                    const rgb = hexToRgb(el.color);
                    code += `        $this->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
                }

                const border = el.border || '0';
                const fill = (el.bgColor && el.bgColor !== 'transparent') ? 'true' : 'false';
                
                if (el.bgColor && el.bgColor !== 'transparent') {
                    const rgb = hexToRgb(el.bgColor);
                    code += `        $this->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
                }

                code += `        $this->SetX($leftMargin);\n`;
                code += `        $this->Cell($usableWidth, ${lineHeight}, utf8_decode('${text}'), '${border}', 1, '${el.align}', ${fill});\n`;
                
                if (el.color && el.color !== '#000000') {
                    code += `        $this->SetTextColor(0, 0, 0);\n`;
                }
                if (el.bgColor && el.bgColor !== 'transparent') {
                    code += `        $this->SetFillColor(255, 255, 255);\n`;
                }
                
                code += `\n`;
                break;
            }

            case 'line': {
                const thickness = el.thickness || 0.2;

                code += `        $currentY = $this->GetY();\n`;
                code += `        $this->SetLineWidth(${thickness});\n`;
                
                if (el.color && el.color !== '#000000') {
                    const rgb = hexToRgb(el.color);
                    code += `        $this->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
                }
                
                code += `        $this->Line($leftMargin, $currentY, $pageWidth - $rightMargin, $currentY);\n`;
                
                if (el.color && el.color !== '#000000') {
                    code += `        $this->SetDrawColor(0, 0, 0);\n`;
                }
                
                code += `        $this->SetY($currentY + 2);\n\n`;
                break;
            }
        }
    });

    return code;
}

function generateBodyCode() {
    let code = '';
    const elementIds = STATE.documentStructure.body || [];

    if (elementIds.length === 0) {
        return '// Sin elementos en el cuerpo\n';
    }

    code += `// ===== CUERPO DEL DOCUMENTO (FLUJO JERÁRQUICO) =====\n`;
    code += `// Los elementos se apilan uno tras otro respetando márgenes\n\n`;

    elementIds.forEach((elementId, index) => {
        let element = null;
        for (let page in STATE.elements) {
            element = STATE.elements[page].find(el => el.id === elementId);
            if (element) break;
        }
        if (!element) return;

        code += `// Elemento ${index + 1}: ${element.type.toUpperCase()}\n`;
        code += generateBodyElementCode(element);
        code += '\n';
    });

    return code;
}

function generateBodyElementCode(el) {
    switch (el.type) {
        case 'text': 
            return generateBodyTextCode(el);
        case 'table': 
            return generateBodyTableCode(el);
        case 'image': 
            return generateBodyImageCode(el);
        case 'line': 
            return generateBodyLineCode(el);
        case 'rect': 
            return generateBodyRectCode(el);
        default: 
            return '';
    }
}

function generateBodyTextCode(el) {
    const fontSize = el.size;
    const lineHeight = (fontSize * 0.45).toFixed(2);

    const text = el.text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r?\n/g, "\n");

    let code = '';
    
    // Configurar fuente
    code += `$pdf->SetFont('${el.font}', '${el.style}', ${fontSize});\n`;

    // Color de texto
    if (el.color && el.color !== '#000000') {
        const rgb = hexToRgb(el.color);
        code += `$pdf->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }

    // Color de fondo
    const fill = (el.bgColor && el.bgColor !== 'transparent') ? 'true' : 'false';
    if (el.bgColor && el.bgColor !== 'transparent') {
        const rgb = hexToRgb(el.bgColor);
        code += `$pdf->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }

    const border = el.border || '0';

    // FLUJO: El texto se posiciona al margen izquierdo
    if (el.isMultiCell) {
        code += `$pdf->SetX($leftMargin);\n`;
        code += `$pdf->MultiCell($usableWidth, ${lineHeight}, utf8_decode('${text}'), '${border}', '${el.align}', ${fill});\n`;
        code += `$pdf->Ln(4); // Espacio después del párrafo\n`;
    } else {
        code += `$pdf->SetX($leftMargin);\n`;
        code += `$pdf->Cell($usableWidth, ${lineHeight}, utf8_decode('${text}'), '${border}', 1, '${el.align}', ${fill});\n`;
    }

    // Reset colores
    if (el.color && el.color !== '#000000') {
        code += `$pdf->SetTextColor(0, 0, 0);\n`;
    }
    if (el.bgColor && el.bgColor !== 'transparent') {
        code += `$pdf->SetFillColor(255, 255, 255);\n`;
    }

    return code;
}

function generateBodyTableCode(el) {
    let code = '';
    
    code += `$pdf->SetFont('${el.font || 'Arial'}', '', ${el.size || 10});\n`;
    
    if (el.textColor && el.textColor !== '#000000') {
        const rgb = hexToRgb(el.textColor);
        code += `$pdf->SetTextColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }

    code += `$cellWidth = $usableWidth / ${el.cols};\n`;
    const cellHeight = (((el.height || el.h || 0) / el.rows) * PIXELS_TO_MM).toFixed(2);

    const cells = el.tableData?.cells || el.data || [];
    
    for (let r = 0; r < el.rows; r++) {
        code += `$pdf->SetX($leftMargin);\n`;
        
        for (let c = 0; c < el.cols; c++) {
            let cell = null;
            if (Array.isArray(cells)) {
                if (cells[r] && cells[r][c]) {
                    cell = cells[r][c];
                } else {
                    cell = cells.find(cell => cell.row === r && cell.col === c);
                }
            }
            
            if (!cell || (cell.merged && (cell.rowspan === 0 || cell.colspan === 0))) continue;
            
            const txt = (cell.text || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            
            let w = `$cellWidth`;
            let h = cellHeight;
            
            if (cell.merged && (cell.rowspan > 1 || cell.colspan > 1)) {
                w = `($cellWidth * ${cell.colspan})`;
                h = (parseFloat(cellHeight) * cell.rowspan).toFixed(2);
            }
            
            if (cell.isHeader) {
                const headerRgb = hexToRgb(el.headerColor || '#d3d3d3');
                code += `$pdf->SetFont('${el.font || 'Arial'}', 'B', ${el.size || 10});\n`;
                code += `$pdf->SetFillColor(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b});\n`;
                code += `$pdf->Cell(${w}, ${h}, utf8_decode('${txt}'), 1, 0, 'C', true);\n`;
                code += `$pdf->SetFont('${el.font || 'Arial'}', '', ${el.size || 10});\n`;
                code += `$pdf->SetFillColor(255, 255, 255);\n`;
            } else {
                code += `$pdf->Cell(${w}, ${h}, utf8_decode('${txt}'), 1, 0, 'L');\n`;
            }
        }
        
        code += `$pdf->Ln();\n`;
    }

    if (el.textColor && el.textColor !== '#000000') {
        code += `$pdf->SetTextColor(0, 0, 0);\n`;
    }
    
    code += `$pdf->Ln(4);\n`;

    return code;
}

function generateBodyImageCode(el) {
    const w = ((el.width || el.w || 50) * PIXELS_TO_MM).toFixed(2);
    const h = ((el.height || el.h || 30) * PIXELS_TO_MM).toFixed(2);

    let code = '';
    code += `if (file_exists('${el.imagePath || el.path || 'imagen.jpg'}')) {\n`;
    code += `    $currentY = $pdf->GetY();\n`;
    code += `    $pdf->Image('${el.imagePath || el.path || 'imagen.jpg'}', $leftMargin, $currentY, ${w}, ${h});\n`;
    code += `    $pdf->SetY($currentY + ${h} + 4);\n`;
    code += `}\n`;

    return code;
}

function generateBodyLineCode(el) {
    const thickness = el.thickness || 0.2;

    let code = '';
    code += `$currentY = $pdf->GetY();\n`;
    code += `$pdf->SetLineWidth(${thickness});\n`;
    
    if (el.color && el.color !== '#000000') {
        const rgb = hexToRgb(el.color);
        code += `$pdf->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }
    
    code += `$pdf->Line($leftMargin, $currentY, $pageWidth - $rightMargin, $currentY);\n`;
    
    if (el.color && el.color !== '#000000') {
        code += `$pdf->SetDrawColor(0, 0, 0);\n`;
    }
    
    code += `$pdf->SetY($currentY + 4);\n`;

    return code;
}

function generateBodyRectCode(el) {
    const h = ((el.height || el.h || 10) * PIXELS_TO_MM).toFixed(2);
    const thickness = el.thickness || 0.2;

    let code = '';
    code += `$currentY = $pdf->GetY();\n`;
    code += `$pdf->SetLineWidth(${thickness});\n`;

    if (el.color && el.color !== '#000000') {
        const rgb = hexToRgb(el.color);
        code += `$pdf->SetDrawColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
    }

    if (el.fill) {
        const rgb = hexToRgb(el.fillColor || '#ffffff');
        code += `$pdf->SetFillColor(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
        code += `$pdf->Rect($leftMargin, $currentY, $usableWidth, ${h}, 'FD');\n`;
    } else {
        code += `$pdf->Rect($leftMargin, $currentY, $usableWidth, ${h});\n`;
    }
    
    if (el.color && el.color !== '#000000') {
        code += `$pdf->SetDrawColor(0, 0, 0);\n`;
    }
    
    code += `$pdf->SetY($currentY + ${h} + 4);\n`;

    return code;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function copyCode() {
    const codeOutput = document.getElementById('code-output');
    if (!codeOutput) return;
    
    navigator.clipboard.writeText(codeOutput.textContent).then(() => {
        showToast('✓ Código copiado al portapapeles');
    }).catch(err => {
        showToast('✗ Error al copiar código');
    });
}

function downloadCode() {
    const codeOutput = document.getElementById('code-output');
    if (!codeOutput) return;
    
    const blob = new Blob([codeOutput.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento_fpdf.php';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✓ Código descargado');
}

function showCodePreview() {
    renderCodePreview(1);
    const modal = document.getElementById('code-preview-modal');
    if (modal) modal.classList.add('active');
}

function closeCodePreview() {
    const modal = document.getElementById('code-preview-modal');
    if (modal) modal.classList.remove('active');
}

function renderCodePreview(scale) {
    const canvas = document.getElementById('code-preview-canvas');
    if (!canvas) return;
    
    // Tamaño A4 en píxeles (a 72 DPI)
    const a4Width = 595;
    const a4Height = 842;
    
    canvas.width = a4Width * scale;
    canvas.height = a4Height * scale;
    
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar elementos de cada sección
    const sections = ['header', 'body', 'footer'];
    sections.forEach(section => {
        const elementIds = STATE.documentStructure[section];
        if (!elementIds) return;
        
        elementIds.forEach(elementId => {
            let element = null;
            for (let page in STATE.elements) {
                element = STATE.elements[page].find(el => el.id === elementId);
                if (element) break;
            }
            if (element) {
                drawPreviewElement(ctx, element, scale);
            }
        });
    });
}

function drawPreviewElement(ctx, element, scale) {
    ctx.save();
    
    const x = element.x * scale;
    const y = element.y * scale;
    const w = (element.width || element.w || 0) * scale;
    const h = (element.height || element.h || 0) * scale;
    
    switch(element.type) {
        case 'text':
            if (element.bgColor !== 'transparent') {
                ctx.fillStyle = element.bgColor;
                ctx.fillRect(x, y, w, h);
            }
            
            ctx.fillStyle = element.color || '#000000';
            ctx.font = `${element.style === 'B' ? 'bold' : 'normal'} ${element.size * scale}px ${element.font}`;
            ctx.textAlign = element.align === 'C' ? 'center' : element.align === 'R' ? 'right' : 'left';
            ctx.textBaseline = 'top';
            
            const textX = element.align === 'C' ? x + w/2 : element.align === 'R' ? x + w - 5 : x + 5;
            
            // Dibujar texto con saltos de línea si es necesario
            const lines = element.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, textX, y + 5 + (i * element.size * scale * 1.2));
            });
            break;
            
        case 'table':
            drawPreviewTable(ctx, element, scale);
            break;
            
        case 'image':
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = '#ff6b6b';
            ctx.font = `${16 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🖼️', x + w/2, y + h/2);
            break;
            
        case 'line':
            ctx.strokeStyle = element.color || '#000000';
            ctx.lineWidth = (element.thickness || 0.2) * scale;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);
            ctx.stroke();
            break;
            
        case 'rect':
            ctx.strokeStyle = element.color || '#000000';
            ctx.lineWidth = (element.thickness || 0.2) * scale;
            if (element.fill) {
                ctx.fillStyle = element.fillColor || '#ffffff';
                ctx.fillRect(x, y, w, h);
            }
            ctx.strokeRect(x, y, w, h);
            break;
    }
    
    ctx.restore();
}

function drawPreviewTable(ctx, table, scale) {
    const x = table.x * scale;
    const y = table.y * scale;
    const w = (table.width || table.w || 0) * scale;
    const h = (table.height || table.h || 0) * scale;
    const cellW = w / table.cols;
    const cellH = h / table.rows;
    
    ctx.font = `${table.size * scale}px ${table.font}`;
    
    const cells = table.tableData?.cells || table.data || [];
    
    for (let r = 0; r < table.rows; r++) {
        for (let c = 0; c < table.cols; c++) {
            let cell = null;
            if (Array.isArray(cells)) {
                if (cells[r] && cells[r][c]) {
                    cell = cells[r][c];
                } else {
                    cell = cells.find(cell => cell.row === r && cell.col === c);
                }
            }
            
            if (!cell || (cell.merged && (cell.rowspan === 0 || cell.colspan === 0))) continue;
            
            const cellX = x + c * cellW;
            const cellY = y + r * cellH;
            let cw = cellW;
            let ch = cellH;
            
            if (cell.merged && (cell.rowspan > 1 || cell.colspan > 1)) {
                cw = cellW * cell.colspan;
                ch = cellH * cell.rowspan;
            }
            
            if (cell.isHeader) {
                ctx.fillStyle = table.headerColor || '#d3d3d3';
                ctx.fillRect(cellX, cellY, cw, ch);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cellX, cellY, cw, ch);
            }
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.2;
            ctx.strokeRect(cellX, cellY, cw, ch);
            
            ctx.fillStyle = table.textColor || '#000000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.text || '', cellX + 3, cellY + ch/2);
        }
    }
}

// ============================================
// UI-UTILS.JS - Utilidades de UI
// ============================================

function showLoading(text, progress) {
    const loadingEl = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const progressFill = document.getElementById('progress-fill');
    
    if (loadingText) loadingText.textContent = text;
    if (progressFill) progressFill.style.width = progress + '%';
    if (loadingEl) loadingEl.classList.add('active');
}

function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.classList.remove('active');
}

function showToast(text) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    
    if (!toast || !toastText) return;
    
    toastText.textContent = text;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

function updateStats() {
    const statPages = document.getElementById('stat-pages');
    const statElements = document.getElementById('stat-elements');
    const statTables = document.getElementById('stat-tables');
    const statImages = document.getElementById('stat-images');
    
    let totalElements = 0;
    for (let page in STATE.elements) {
        totalElements += STATE.elements[page].length;
    }
    
    if (statPages) statPages.textContent = STATE.totalPages;
    if (statElements) statElements.textContent = totalElements;
    if (statTables) statTables.textContent = countByType('table');
    if (statImages) statImages.textContent = countByType('image');
}

function countByType(type) {
    let count = 0;
    for (let page in STATE.elements) {
        count += STATE.elements[page].filter(el => el.type === type).length;
    }
    return count;
}
