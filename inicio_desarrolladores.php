<?php
session_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Designer Pro - Sistema Completo Mejorado</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="informes/informes.css">
</head>
<body>
    <div class="app-container">
        <!-- HEADER -->
        <div class="header">
            <div class="header-left">
                <div class="logo">
                    <i class="fas fa-magic"></i>
                    PDF Designer Pro - Sistema Completo Mejorado
                </div>
            </div>
            <div class="header-actions">
                <a href="informes_desarrollador/informe_dev.php" class="btn btn-primary>
                    <i class="fas fa-arrow-left"></i>
                    <span>Volver a Informes</span>
                </a>
                <button class="btn" onclick="showHelp()">
                    <i class="fas fa-question-circle"></i> Ayuda
                </button>
                <button class="btn btn-primary" onclick="showCodeModal()">
                    <i class="fas fa-code"></i> Generar Código FPDF
                </button>
            </div>
        </div>
        
        <!-- TOOLBAR -->
        <div class="toolbar">
            <div class="tool-group">
                <input type="file" id="pdf-upload" accept=".pdf" style="display: none;" onchange="loadPDF(event)">
                <button class="tool-btn" onclick="document.getElementById('pdf-upload').click()">
                    <i class="fas fa-upload"></i> Cargar PDF
                </button>
                <button class="tool-btn" onclick="clearAll()" id="clear-btn" disabled>
                    <i class="fas fa-trash"></i> Limpiar Todo
                </button>
            </div>
            
            <div class="tool-group">
                <button class="tool-btn active" onclick="setTool('select')" id="tool-select">
                    <i class="fas fa-mouse-pointer"></i> Seleccionar
                </button>
                <button class="tool-btn" onclick="setTool('text')" id="tool-text">
                    <i class="fas fa-font"></i> Texto
                </button>
                <button class="tool-btn" onclick="setTool('table')" id="tool-table">
                    <i class="fas fa-table"></i> Tabla
                </button>
                <button class="tool-btn" onclick="setTool('image')" id="tool-image">
                    <i class="fas fa-image"></i> Imagen
                </button>
                <button class="tool-btn" onclick="setTool('line')" id="tool-line">
                    <i class="fas fa-minus"></i> Línea
                </button>
                <button class="tool-btn" onclick="setTool('rect')" id="tool-rect">
                    <i class="fas fa-square"></i> Rectángulo
                </button>
            </div>

              <!-- 🆕 NUEVO GRUPO: BOTONES DE AGRUPACIÓN HORIZONTAL -->
            <div class="tool-group">
                <button class="tool-btn" id="group-btn" onclick="createHorizontalGroup()" disabled title="Selecciona 2+ elementos con Ctrl+Click y agrúpalos horizontalmente (Ctrl+G)">
                    <i class="fas fa-object-group"></i> Agrupar Horizontal
                </button>
                <button class="tool-btn" id="ungroup-btn" onclick="ungroupElements()" disabled title="Desagrupar elementos seleccionados (Ctrl+Shift+G)">
                    <i class="fas fa-object-ungroup"></i> Desagrupar
                </button>
            </div>
            
            
            <div class="tool-group">
                <button class="tool-btn" onclick="duplicateElement()" id="duplicate-btn" disabled>
                    <i class="fas fa-copy"></i> Duplicar
                </button>
                <button class="tool-btn" onclick="deleteElement()" id="delete-btn" disabled>
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                <button class="tool-btn" onclick="assignToSection()" id="assign-section-btn" disabled>
                    <i class="fas fa-folder-plus"></i> Asignar Sección
                </button>
            </div>
            
            <div class="tool-group">
                <button class="tool-btn" onclick="bringToFront()" id="bring-front-btn" disabled>
                    <i class="fas fa-arrow-up"></i> Al Frente
                </button>
                <button class="tool-btn" onclick="sendToBack()" id="send-back-btn" disabled>
                    <i class="fas fa-arrow-down"></i> Atrás
                </button>
            </div>
            
            <div class="tool-group">
                <button class="tool-btn" onclick="toggleGrid()" id="grid-btn">
                    <i class="fas fa-th"></i> Grilla
                </button>
                <button class="tool-btn" onclick="toggleMargins()" id="margins-btn">
                    <i class="fas fa-border-style"></i> Márgenes
                </button>
                <button class="tool-btn" onclick="autoAdjustFonts()" id="auto-font-btn" disabled>
                    <i class="fas fa-text-height"></i> Ajustar Fuentes
                </button>
            </div>
            
            <div class="tool-group">
                <div class="zoom-control">
                    <button class="tool-btn" onclick="zoomOut()"><i class="fas fa-search-minus"></i></button>
                    <input type="range" class="zoom-slider" min="50" max="200" value="100" id="zoom-slider" oninput="updateZoom(this.value)">
                    <span id="zoom-value">100%</span>
                    <button class="tool-btn" onclick="zoomIn()"><i class="fas fa-search-plus"></i></button>
                </div>
            </div>
            
            <div class="tool-group">
                <button class="tool-btn" onclick="prevPage()" id="prev-page" disabled>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span id="page-info">-</span>
                <button class="tool-btn" onclick="nextPage()" id="next-page" disabled>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        
        <!-- MAIN LAYOUT -->
        <div class="main-layout">
            <!-- SIDEBAR -->
            <div class="sidebar">
                <div class="sidebar-section">
                    <div class="section-title">
                        <i class="fas fa-chart-bar"></i> Estadísticas
                    </div>
                    <div id="stats-content" class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="stat-pages">0</div>
                            <div class="stat-label">Páginas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-elements">0</div>
                            <div class="stat-label">Elementos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-tables">0</div>
                            <div class="stat-label">Tablas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-images">0</div>
                            <div class="stat-label">Imágenes</div>
                        </div>
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <div class="section-title">
                        <i class="fas fa-sitemap"></i> Estructura del Documento
                    </div>
                    <div class="document-structure">
                        <div class="structure-section">
                            <div class="structure-header" onclick="toggleStructureSection('header')">
                                <i class="fas fa-file-alt"></i>
                                <span>HEADER</span>
                                <span class="element-count" id="header-count">0</span>
                                <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                            </div>
                            <div class="structure-elements" id="header-elements">
                                <div class="empty-state" style="padding: 10px; font-size: 11px;">Sin elementos</div>
                            </div>
                        </div>
                        
                        <div class="structure-section">
                            <div class="structure-header" onclick="toggleStructureSection('body')">
                                <i class="fas fa-align-left"></i>
                                <span>BODY</span>
                                <span class="element-count" id="body-count">0</span>
                                <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                            </div>
                            <div class="structure-elements" id="body-elements">
                                <div class="empty-state" style="padding: 10px; font-size: 11px;">Sin elementos</div>
                            </div>
                        </div>
                        
                        <div class="structure-section">
                            <div class="structure-header" onclick="toggleStructureSection('footer')">
                                <i class="fas fa-file-alt"></i>
                                <span>FOOTER</span>
                                <span class="element-count" id="footer-count">0</span>
                                <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                            </div>
                            <div class="structure-elements" id="footer-elements">
                                <div class="empty-state" style="padding: 10px; font-size: 11px;">Sin elementos</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <div class="section-title">
                        <i class="fas fa-layer-group"></i> Elementos (Pág. <span id="elements-page">-</span>)
                    </div>
                    <div class="element-list" id="elements-list">
                        <div class="empty-state">Carga un PDF o empieza a dibujar</div>
                    </div>
                </div>
            </div>

            
            <!-- CANVAS AREA -->
            <div class="canvas-area" id="canvas-area">
                <div class="canvas-wrapper" id="canvas-wrapper">
                    <canvas id="pdf-canvas"></canvas>
                    <canvas class="canvas-overlay" id="canvas-overlay"></canvas>
                    <canvas class="grid-overlay" id="grid-overlay"></canvas>
                    <div class="margin-guide" id="margin-top"></div>
                    <div class="margin-guide" id="margin-bottom"></div>
                    <div class="margin-guide" id="margin-left"></div>
                    <div class="margin-guide" id="margin-right"></div>
                </div>
                <div class="measurement-tooltip" id="measurement-tooltip"></div>
            </div>
            
            <!-- PROPERTIES PANEL -->
            <div class="properties-panel">
                <div class="section-title">
                    <i class="fas fa-sliders-h"></i> Propiedades del Elemento
                </div>
                <div id="properties-content">
                    <div class="empty-state">Selecciona un elemento para editar sus propiedades</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- TEXT DETECTION MODAL -->
    <div class="modal" id="text-detection-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-font"></i> Texto Detectado
                </div>
                <button class="modal-close" onclick="closeTextDetectionModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="detected-text-preview">
                    <div class="property-label">Texto detectado en el PDF:</div>
                    <div class="detected-text-box" id="detected-text-content"></div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Tipo de elemento:</label>
                    <select class="property-input" id="text-element-type">
                        <option value="title">Título (16pt, Negrita)</option>
                        <option value="subtitle">Subtítulo (12pt, Negrita)</option>
                        <option value="paragraph" selected>Párrafo (10pt, Normal)</option>
                        <option value="multicell">MultiCell (Texto largo)</option>
                        <option value="cell">Cell (Una línea)</option>
                    </select>
                    <small class="property-hint">Selecciona el tipo de elemento que quieres crear</small>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="createTextElement()">
                        <i class="fas fa-check"></i> Crear Elemento
                    </button>
                    <button class="btn" onclick="closeTextDetectionModal()">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>

    
    
    <!-- SECTION ASSIGNMENT MODAL -->
    <div class="modal" id="section-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-folder-plus"></i> Asignar a Sección
                </div>
                <button class="modal-close" onclick="closeSectionModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="section-options">
                    <button class="section-option-btn" onclick="assignElementToSection('header')">
                        <i class="fas fa-file-alt"></i>
                        <div>HEADER</div>
                        <small>Encabezado de todas las páginas</small>
                    </button>
                    <button class="section-option-btn" onclick="assignElementToSection('body')">
                        <i class="fas fa-align-left"></i>
                        <div>BODY</div>
                        <small>Contenido principal del documento</small>
                    </button>
                    <button class="section-option-btn" onclick="assignElementToSection('footer')">
                        <i class="fas fa-file-alt"></i>
                        <div>FOOTER</div>
                        <small>Pie de página de todas las páginas</small>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- ADVANCED TABLE EDITOR MODAL -->
    <div class="modal" id="advanced-table-modal">
        <div class="modal-content" style="max-width: 95%; width: 1400px;">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-table"></i> Editor Avanzado de Tabla - Nivel Excel/Canva
                </div>
                <button class="modal-close" onclick="closeAdvancedTableEditor()">×</button>
            </div>
            <div class="modal-body" style="padding: 0;">
                <!-- TOOLBAR SUPERIOR -->
                <div class="table-editor-toolbar">
                    <button class="tool-btn" onclick="addTableRow()">
                        <i class="fas fa-plus"></i> Fila
                    </button>
                    <button class="tool-btn" onclick="addTableColumn()">
                        <i class="fas fa-plus"></i> Columna
                    </button>
                    <button class="tool-btn" onclick="removeTableRow()">
                        <i class="fas fa-minus"></i> Fila
                    </button>
                    <button class="tool-btn" onclick="removeTableColumn()">
                        <i class="fas fa-minus"></i> Columna
                    </button>
                    
                    <div class="separator"></div>
                    
                    <button class="tool-btn" onclick="mergeCells()" title="Combinar celdas seleccionadas (Selecciona múltiples con Ctrl+Click)">
                        <i class="fas fa-object-group"></i> Combinar
                    </button>
                    <button class="tool-btn" onclick="splitCells()">
                        <i class="fas fa-object-ungroup"></i> Separar
                    </button>
                    
                    <div class="separator"></div>
                    
                    <button class="tool-btn" onclick="toggleHeaderCell()">
                        <i class="fas fa-heading"></i> Encabezado
                    </button>
                    <button class="tool-btn" onclick="toggleCellBold()">
                        <i class="fas fa-bold"></i> Negrita
                    </button>
                    <button class="tool-btn" onclick="toggleCellItalic()">
                        <i class="fas fa-italic"></i> Cursiva
                    </button>
                    <button class="tool-btn" onclick="toggleCellUnderline()">
                        <i class="fas fa-underline"></i> Subrayar
                    </button>
                    
                    <div class="separator"></div>
                    
                    <button class="tool-btn" onclick="setCellAlignment('L')" title="Alinear izquierda">
                        <i class="fas fa-align-left"></i>
                    </button>
                    <button class="tool-btn" onclick="setCellAlignment('C')" title="Alinear centro">
                        <i class="fas fa-align-center"></i>
                    </button>
                    <button class="tool-btn" onclick="setCellAlignment('R')" title="Alinear derecha">
                        <i class="fas fa-align-right"></i>
                    </button>
                    
                    <div class="separator"></div>
                    
                    <button class="tool-btn" onclick="copyCells()" title="Copiar (Ctrl+C)">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                    <button class="tool-btn" onclick="pasteCells()" title="Pegar (Ctrl+V)">
                        <i class="fas fa-paste"></i> Pegar
                    </button>
                    <button class="tool-btn" onclick="cutCells()" title="Cortar (Ctrl+X)">
                        <i class="fas fa-cut"></i> Cortar
                    </button>
                    
                    <div class="separator"></div>
                    
                    <button class="tool-btn" onclick="undo()" title="Deshacer (Ctrl+Z)">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="tool-btn" onclick="redo()" title="Rehacer (Ctrl+Shift+Z)">
                        <i class="fas fa-redo"></i>
                    </button>
                    
                    <!-- CONTROLES DE FORMATO -->
                    <div class="format-controls">
                        <label>Tamaño:</label>
                        <input type="number" id="cell-font-size" value="10" min="6" max="48" onchange="setCellFontSize(this.value)">
                        
                        <label>Fuente:</label>
                        <select id="cell-font-family" onchange="setCellFontFamily(this.value)">
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times">Times</option>
                            <option value="Courier">Courier</option>
                            <option value="Symbol">Symbol</option>
                        </select>
                        
                        <label>Fondo:</label>
                        <input type="color" id="cell-bg-color" value="#FFFFFF" onchange="setCellBackgroundColor(this.value)">
                        
                        <label>Texto:</label>
                        <input type="color" id="cell-text-color" value="#000000" onchange="setCellTextColor(this.value)">
                        
                        <label>Borde:</label>
                        <input type="color" id="cell-border-color" value="#000000" onchange="setCellBorderColor('all', this.value)">
                        <input type="number" id="cell-border-width" value="1" min="0" max="10" step="0.5" onchange="setCellBorderWidth('all', this.value)" style="width: 60px;">
                    </div>
                </div>
                
                <!-- GRID DE LA TABLA -->
                <div class="table-editor-grid" id="table-editor-grid"></div>
                
                <!-- INFO DE SELECCIÓN -->
                <div id="table-selection-info">Sin selección - Usa Ctrl+Click para seleccionar múltiples celdas</div>
                
                <!-- BOTONES DE EXPORTACIÓN -->
                <div class="export-buttons">
                    <button class="btn" onclick="exportToExcel()">
                        <i class="fas fa-file-excel"></i> Exportar a Excel (CSV)
                    </button>
                    <button class="btn" onclick="exportToWord()">
                        <i class="fas fa-file-word"></i> Exportar a Word (HTML)
                    </button>
                    <button class="btn" onclick="exportToCanva()">
                        <i class="fas fa-file-code"></i> Exportar a Canva (JSON)
                    </button>
                </div>
                
                <!-- ACCIONES -->
                <div class="modal-actions" style="padding: 20px;">
                    <button class="btn btn-primary" onclick="saveAdvancedTable()">
                        <i class="fas fa-save"></i> Guardar Tabla
                    </button>
                    <button class="btn" onclick="closeAdvancedTableEditor()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn" onclick="clearCellFormatting()" style="margin-left: auto;">
                        <i class="fas fa-eraser"></i> Limpiar Formato
                    </button>
                    <button class="btn" onclick="selectAllCells()">
                        <i class="fas fa-check-square"></i> Seleccionar Todo
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- CODE PREVIEW MODAL -->
    <div class="modal" id="code-preview-modal">
        <div class="modal-content" style="max-width: 1400px;">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-eye"></i> Vista Previa del Documento
                </div>
                <button class="modal-close" onclick="closeCodePreview()">×</button>
            </div>
            <div class="modal-body">
                <div class="preview-info">
                    <i class="fas fa-info-circle"></i>
                    Esta es una vista previa aproximada de cómo se verá tu documento PDF generado
                </div>
                
                <div class="property-group">
                    <label class="property-label">Escala de vista previa:</label>
                    <input type="range" class="property-input" id="preview-scale" min="0.1" max="1" step="0.1" value="0.3" onchange="renderCodePreview(this.value)">
                </div>
                
                <div class="preview-canvas-wrapper">
                    <canvas id="code-preview-canvas"></canvas>
                </div>
            </div>
        </div>
    </div>
    
    <!-- CODE MODAL -->
    <div class="modal" id="code-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-code"></i> Código FPDF Generado
                </div>
                <button class="modal-close" onclick="hideCodeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="code-output" id="code-output"></div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="copyCode()">
                        <i class="fas fa-copy"></i> Copiar Código
                    </button>
                    <button class="btn" onclick="downloadCode()">
                        <i class="fas fa-download"></i> Descargar PHP
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- LOADING -->
    <div class="loading" id="loading">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div id="loading-text">Procesando...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
        </div>
    </div>
    
    <!-- TOAST -->
    <div class="toast" id="toast">
        <span id="toast-text"></span>
    </div>

    
    
    <!-- SCRIPTS MODULARES -->
    <script src="informes/js/core.js"></script>
    <script src="informes/js/canvas.js"></script>
    <script src="informes/js/elements.js"></script>
    <script src="informes/js/text-detection.js"></script>
    <script src="informes/js/table-editor.js"></script>
    <script src="informes/js/structure.js"></script>
    <script src="informes/js/remaining-modules.js"></script>


     <script>
        // Atajos de teclado para agrupación
        document.addEventListener('keydown', function(e) {
            // Ctrl+G o Cmd+G para agrupar
            if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
                e.preventDefault();
                if (STATE.selectedElements.length >= 2) {
                    createHorizontalGroup();
                } else {
                    showToast('✗ Selecciona al menos 2 elementos con Ctrl+Click');
                }
            }
            
            // Ctrl+Shift+G para desagrupar
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                if (STATE.selectedElement) {
                    ungroupElements();
                }
            }
        });
        
        // Mostrar/ocultar hint de selección múltiple
        let hintTimeout;
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                const hint = document.getElementById('multi-select-hint');
                if (hint && STATE.tool === 'select') {
                    clearTimeout(hintTimeout);
                    hint.classList.add('active');
                }
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (!e.ctrlKey && !e.metaKey) {
                const hint = document.getElementById('multi-select-hint');
                if (hint) {
                    hintTimeout = setTimeout(() => {
                        hint.classList.remove('active');
                    }, 2000);
                }
            }
        });
    </script>
</body>
</html>