# Especificación Funcional — Aplicación Web de Gestión de Tareas

**Versión:** 1.0  
**Fecha:** 2026-04-30  
**Estado:** Borrador  
**Tipo:** Aplicación web personal (SPA)

---

## 1. Propósito

La aplicación permite gestionar tareas personales de forma clara, rápida y visual. Está diseñada para uso individual, sin colaboración ni soporte multiusuario.

**Objetivos principales:**

- Organización diaria de actividades
- Seguimiento del progreso de tareas
- Control de tareas pendientes y vencidas

---

## 2. Gestión de Tareas

### 2.1 Crear tarea

Las tareas se crean desde un modal de acceso rápido.

**Campos del formulario:**

| Campo        | Tipo       | Requerido | Valores posibles                           |
|--------------|------------|-----------|--------------------------------------------|
| Título       | Texto      | Sí        | —                                          |
| Descripción  | Texto largo | No       | —                                          |
| Fecha límite | Fecha      | No        | —                                          |
| Prioridad    | Selector   | Sí        | Alta · Media · Baja                        |
| Categoría    | Selector   | Sí        | Ministerio · Trabajo · Estudio · Personal  |

**Comportamiento:**

- El foco se posiciona automáticamente en el campo de título al abrir el modal.
- La tarea se puede guardar presionando `Enter`.
- Si el título está vacío, la tarea no se guarda.

---

### 2.2 Visualización de tareas

Las tareas se muestran en un tablero tipo **Kanban**, dividido en cinco columnas según su estado:

1. Por hacer
2. En proceso
3. Completadas
4. Pospuestas
5. Canceladas

**Cada tarjeta muestra:**

- Título de la tarea
- Prioridad (indicada con color)
- Fecha límite (si existe)
- Indicador visual de tarea vencida
- Categoría

---

### 2.3 Cambio de estado

El usuario puede cambiar el estado de una tarea mediante:

- **Drag & drop:** arrastrando la tarjeta entre columnas.
- **Selector interno:** desde el panel de edición completa de la tarea.

---

### 2.4 Edición de tareas

Se soportan dos modos de edición:

- **Rápida (inline):** edición directa del título desde la tarjeta.
- **Completa (modal):** edición de todos los campos de la tarea.

---

### 2.5 Eliminación de tareas

- El usuario puede eliminar cualquier tarea manualmente.
- La eliminación es directa; no existe papelera de reciclaje.

---

### 2.6 Posponer tarea

- Acción rápida disponible desde la tarjeta.
- Cambia el estado de la tarea a `Pospuesta`.
- Conserva todos los datos originales de la tarea.

---

### 2.7 Subtareas

Las tareas pueden contener subtareas asociadas.

**Comportamiento:**

- Se muestran dentro de la tarjeta o panel de la tarea principal.
- Interfaz visual tipo checklist.
- Cada subtarea puede marcarse como completada o no completada.
- Las subtareas no tienen estados complejos (solo `completada` / `pendiente`).

---

### 2.8 Categorías

Cada tarea pertenece a **una única categoría**:

- Ministerio
- Trabajo
- Estudio
- Personal

No se permite asignar múltiples categorías a una misma tarea.

---

### 2.9 Prioridad

| Nivel  | Color visual |
|--------|--------------|
| Alta   | Rojo         |
| Media  | Amarillo     |
| Baja   | Gris         |

---

### 2.10 Fechas límite

- La fecha límite es un campo opcional.
- Si la fecha pasa sin que la tarea esté completada:
  - La tarea se marca automáticamente como **vencida**.
  - Se resalta visualmente en color rojo.

---

## 3. Dashboard

Vista de métricas con resumen del estado general de tareas.

### Indicadores

- Total de tareas
- Tareas completadas
- Tareas pendientes
- Tareas vencidas

### Visualizaciones

- **Gráfico de barras:** distribución de tareas por estado.
- **Gráfico de línea:** productividad a lo largo del tiempo.

---

## 4. Búsqueda y Filtros

### Búsqueda

- Por título de tarea.

### Filtros disponibles

- Por categoría
- Por prioridad
- Por estado

### Ordenamiento

- Por fecha límite
- Por prioridad
- Por fecha de creación

---

## 5. Exportación

El usuario puede exportar el listado completo de tareas en formato simple (**JSON** o **CSV**).

---

## 6. Experiencia de Uso

La aplicación debe cumplir los siguientes principios de UX:

- Carga rápida sin tiempos de espera perceptibles.
- Interacciones inmediatas y sin latencia visual.
- Sin pasos innecesarios en los flujos principales.
- Flujo optimizado para uso diario continuo.

---

## 7. Alcance

### Incluido en esta versión

- CRUD completo de tareas
- Subtareas con checklist
- Tablero Kanban con drag & drop
- Dashboard con métricas básicas
- Filtros y búsqueda
- Exportación de datos

### Fuera de alcance (versiones futuras)

- Autenticación y multiusuario
- Notificaciones push o por correo
- Integración con calendario externo
- Backend y sincronización en la nube

---

## 8. Resumen Técnico

| Aspecto                  | Decisión                                        |
|--------------------------|-------------------------------------------------|
| Tipo de aplicación       | SPA (Single Page Application)                   |
| Framework frontend       | React (o equivalente moderno)                   |
| Almacenamiento           | Base de datos en el navegador (ej. IndexedDB)   |
| Drag & drop              | Soporte nativo requerido                        |
| Gestión de estado        | Centralizada (ej. Zustand, Redux o Context API) |
| Preparación para backend | Arquitectura modular y desacoplada              |

---

## 9. Criterios de Calidad

- **Sin pérdida de datos:** toda acción del usuario debe persistir correctamente.
- **UI clara y legible:** jerarquía visual definida, tipografía y contraste adecuados.
- **Acciones principales en máximo 1–2 clics:** crear, editar, cambiar estado y eliminar deben ser accesibles de forma inmediata.
- **Código mantenible y escalable:** estructura modular que facilite extensiones futuras sin refactorizaciones mayores.

---

*Documento generado para uso interno del proyecto. Sujeto a revisión conforme avance el desarrollo.*
