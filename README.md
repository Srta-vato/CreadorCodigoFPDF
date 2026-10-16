PDF Designer Pro

Estado del Proyecto
*Nota de desarrollo: Este módulo se encuentra en fase de desarrollo activo. La arquitectura modular, las herramientas de manipulación de elementos y los generadores de exportación están sujetos a iteraciones y ampliaciones continuas.

Descripción General
PDF Designer Pro es una aplicación web interactiva diseñada para la maquetación visual, análisis y edición estructurada de documentos PDF. Permite a los desarrolladores y usuarios cargar documentos de referencia, manipular elementos gráficos y de texto directamente sobre un lienzo interactivo, estructurarlos por secciones lógicas (Header, Body, Footer) y generar de forma automática código fuente en PHP utilizando la librería FPDF.

Arquitectura de Software y Módulos
Requisitos del Sistema
Frontend: HTML5, CSS3, JavaScript (ES6+).
Librerías Externas (CDN):
PDF.js (versión 3.11.174) para la renderización y procesamiento de archivos PDF.
Tailwind CSS para la maquetación de componentes de interfaz.
FontAwesome 6.4.0 para el sistema de iconografía vectorial.

Estructura de Scripts Modulares
La lógica de la aplicación se encuentra dividida en módulos JavaScript independientes ubicados en el directorio informes/js/:
core.js: Inicialización del estado global de la aplicación y gestión de variables principales.
canvas.js: Control de la renderización del lienzo, zoom, capas de grilla y guías de margen.
elements.js: Administración, selección, duplicación y posicionamiento de elementos (texto, tablas, imágenes, líneas, rectángulos).
text-detection.js: Funciones de análisis y extracción de texto detectado en los documentos cargados.
table-editor.js: Editor avanzado de tablas con capacidades de combinación de celdas, filas y columnas.
structure.js: Gestión de la jerarquía del documento dividida en secciones lógicas (Header, Body, Footer).
remaining-modules.js: Funciones complementarias de exportación y ajustes de formato.

Características Principales y Funcionalidades
Carga y Visualización de PDF: Importación de archivos mediante selector de archivos y renderizado adaptativo en canvas con controles de paginación y zoom dinámico (50% a 200%).Herramientas de Edición Visual:
Selección de elementos.
Inserción y configuración de bloques de texto, tablas avanzadas, imágenes, líneas y rectángulos.
Agrupación horizontal y desagrupación de elementos mediante botones dedicados o atajos de teclado.
Control de capas (ordenar al frente o enviar atrás).
Estructuración por Secciones: Clasificación de componentes del documento en tres bloques fundamentales: Header, Body y Footer.
Editor Avanzado de Tablas: Interfaz tipo hoja de cálculo para la gestión de celdas, alineaciones, tipografías, colores de fondo, bordes y funciones de exportación a CSV (Excel), HTML (Word) y JSON (Canva).
Generación de Código FPDF: Traducción automática de la interfaz y los elementos posicionados a código PHP ejecutable basado en FPDF, listo para copiar o descargar.

Atajos de Teclado Soportados
Ctrl + G / Cmd + G: Agrupar los elementos seleccionados horizontalmente (requiere selección múltiple con Ctrl + Click).
Ctrl + Shift + G / Cmd + Shift + G: Desagrupar el elemento seleccionado.
