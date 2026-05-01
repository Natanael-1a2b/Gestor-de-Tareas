# Roadmap de Desarrollo - Gestor de Tareas
> **Instrucciones para Agentes**: Seguir las fases en orden secuencial. No iniciar una fase sin autorización del usuario.

## 📋 Resumen del Proyecto
- **Estimación Total**: 8 semanas.
- **Metodología**: Entrega continua de funcionales.
- **Stack Base**: React + IndexedDB + (Zustand/Redux).

---

## 🏗️ Fase 1: Fundación (Semanas 1–2)
**Objetivo**: Establecer la base técnica y persistencia.
- [ ] **Estructura del Proyecto**: 
    - Setup de React.
    - Configuración de enrutamiento.
    - Organización de carpetas (`/components`, `/hooks`, `/store`, `/services`).
- [ ] **Modelo de Datos**: 
    - Esquema de tareas para **IndexedDB**.
- [ ] **Gestión de Estado**: 
    - Implementación del Store centralizado.

**Entregable**: Proyecto base con persistencia funcional.

---

## 🚀 Fase 2: Core Funcional (Semanas 3–5)
**Objetivo**: Hacer la aplicación utilizable para el día a día.
- [ ] **CRUD de Tareas**: Edición inline y modales.
- [ ] **Tablero Kanban**: Columnas (Todo, In Progress, Done, Postponed, Cancelled).
- [ ] **Drag & Drop**: Movimiento de tarjetas entre columnas.
- [ ] **Subtareas**: Checklist interno por tarea.

**Entregable**: Tablero Kanban operativo.

---

## ✨ Fase 3: Experiencia Completa (Semanas 6–7)
**Objetivo**: Herramientas de productividad avanzada.
- [ ] **Búsqueda y Filtros**: Por título, categoría, prioridad y estado.
- [ ] **Sistema de Fechas**: Alertas visuales para tareas vencidas.
- [ ] **Dashboard**: Gráficos de métricas clave (línea y barras).
- [ ] **Exportación**: Formatos JSON y CSV.

**Entregable**: Aplicación con alcance funcional completo.

---

## 💎 Fase 4: Pulido y Calidad (Semana 8)
**Objetivo**: Estabilidad y optimización final (v1.0).
- [ ] **UX & Accesibilidad**: Validar regla de "máximo 2 clics".
- [ ] **Performance**: Carga instantánea y transiciones fluidas.
- [ ] **Arquitectura Backend-Ready**: Desacoplar capa de datos para futura migración.

**Entregable**: Versión 1.0 Estable.
