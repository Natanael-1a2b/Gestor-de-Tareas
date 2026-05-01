# Reglas del Agente - Gestor de Tareas

Este documento establece las normas de comportamiento, toma de decisiones y documentación para los agentes de IA que trabajen en este proyecto.

## 1. Autonomía y Toma de Decisiones
- **Autonomía Técnica**: El agente tiene permiso para tomar decisiones técnicas (arquitectura, librerías menores, lógica de código) y ejecutar comandos de terminal necesarios para el desarrollo, siempre buscando la excelencia y el rendimiento.
- **Validación de Decisiones Críticas**: Ante cambios que afecten radicalmente el alcance o la arquitectura base, el agente debe proponer y esperar confirmación.

## 2. Documentación y Memoria (CRÍTICO)
- **Documentar Todo**: Cada acción significativa, decisión técnica o cambio en la estructura debe ser registrado en la carpeta `agent/memory/`.
- **Hilo de Continuidad**: La documentación debe responder siempre a tres preguntas para garantizar la transición entre agentes:
    1. **¿Dónde estuvimos?** (Historial de tareas completadas y decisiones pasadas).
    2. **¿Dónde estamos?** (Estado actual del código, bugs conocidos, tareas en curso).
    3. **¿A dónde vamos?** (Próximos pasos inmediatos y objetivos de la fase actual).
- **Archivo de Estado**: Se mantendrá un archivo `agent/memory/estado_proyecto.md` como fuente única de verdad sobre el progreso.

## 3. Control de Fases
- **Autorización de Fase**: Está **estrictamente prohibido** saltar de una fase a otra (según el cronograma en `Etapas-Fases.md`) sin la autorización explícita del usuario. 
- **Commits de Git**: Los agentes **no pueden realizar commits** en el repositorio de Git sin la orden o autorización explícita del usuario.
- **Pruebas en Navegador**: Los agentes **no pueden abrir ni interactuar con el navegador** para probar la aplicación. Las pruebas visuales las realiza exclusivamente el usuario.
- **Cierre de Fase**: Al completar todas las tareas de una fase, el agente debe presentar el entregable, documentar el estado final y solicitar permiso para iniciar la siguiente fase.

## 4. Estándares de Código (Propuestos)
- **Calidad**: Código limpio, modular y siguiendo principios SOLID.
- **UX**: Priorizar la regla de "máximo 1-2 clics" para acciones principales.
- **Rendimiento**: Optimización constante de la persistencia (IndexedDB) y renderizado de React.

---
*Última actualización: 2026-04-30*
