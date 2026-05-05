# Implementar: Histórico de Tareas Completadas

## Resumen

Agregar un botón "Archivar" en cada tarjeta que esté en la columna **"Completadas"** (status: `Completadas`). Al presionar ese botón, la tarea se mueve a una **sección de historial** que aparece debajo del tablero Kanban en la misma página (`/`). La tarea se remueve de la columna "Completadas" y aparece en el historial como una **lista compacta expandible** (no como cards del Kanban).

---

## Comportamiento esperado

1. **Botón "Archivar"**: Visible solo en tarjetas con `status === 'Completadas'`. Puede ser un ícono de `Archive` (lucide-react). Se ubica en el menú de acciones de la tarjeta (junto a Editar y Eliminar) o como botón visible directamente en la card.

2. **Al presionar "Archivar"**:
   - La tarea cambia su status a un nuevo valor: `'Archivada'`
   - Desaparece de la columna "Completadas" del Kanban
   - Aparece en la sección de historial debajo del tablero

3. **Sección de Historial** (debajo del Kanban):
   - Título: "Historial de Tareas" con un contador
   - Las tareas se muestran como una **lista compacta** (NO como cards del Kanban)
   - Cada fila muestra: título, categoría (badge pequeño), fecha de completado
   - Al hacer **clic en una fila**, se expande y muestra los detalles completos (descripción, prioridad, subtareas)
   - Incluir botón "Restaurar" para devolver la tarea al Kanban como "Por hacer"
   - Incluir botón "Eliminar permanentemente"

4. **El historial NO tiene drag & drop**. Es solo lectura con opciones de restaurar/eliminar.

---

## Archivos a modificar

### 1. `src/services/db.ts`
Agregar `'Archivada'` al tipo `Status`:
```typescript
export type Status = 'Por hacer' | 'En proceso' | 'Completadas' | 'Canceladas' | 'Archivada';
```

### 2. `src/services/SupabaseRepository.ts`
- Modificar `getAll()`: Filtrar tareas donde `status != 'Archivada'` para que no aparezcan en el Kanban
- Agregar método `getArchived()`: Obtener tareas donde `status = 'Archivada'`, ordenadas por `created_at DESC`
- Agregar método `archiveTask(id)`: Actualizar status a `'Archivada'`
- Agregar método `restoreTask(id)`: Actualizar status a `'Por hacer'`

```typescript
async getAll(): Promise<Task[]> {
  // Agregar .neq('status', 'Archivada') al query existente
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .neq('status', 'Archivada')
    .order('created_at', { ascending: false });
  // ...
}

async getArchived(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('status', 'Archivada')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(this.mapToClient);
}

async archiveTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'Archivada' })
    .eq('id', id);
  if (error) throw error;
}

async restoreTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'Por hacer' })
    .eq('id', id);
  if (error) throw error;
}
```

### 3. `src/services/TaskRepository.ts`
Agregar a la interfaz `ITaskRepository`:
```typescript
getArchived(): Promise<Task[]>;
archiveTask(id: string): Promise<void>;
restoreTask(id: string): Promise<void>;
```

### 4. `src/store/useTaskStore.ts`
Agregar al store:
- Estado: `archivedTasks: Task[]`
- Action: `fetchArchivedTasks()` — llama a `taskRepository.getArchived()`
- Action: `archiveTask(id)` — con optimistic update: remueve de `tasks`, agrega a `archivedTasks`
- Action: `restoreTask(id)` — con optimistic update: remueve de `archivedTasks`, agrega a `tasks`
- Modificar `subscribeToRealtime()`: También refrescar `archivedTasks` cuando hay cambios
- Asegurar que `fetchTasks()` también llame a `fetchArchivedTasks()`

### 5. `src/components/TaskCard.tsx`
En el menú de acciones (`.kanban-card-menu`), agregar un botón "Archivar" que solo aparece cuando `task.status === 'Completadas'`:
```tsx
{task.status === 'Completadas' && (
  <button onClick={() => { archiveTask(task.id!); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Archive size={13} /> Archivar
  </button>
)}
```
Importar `Archive` de `lucide-react` y `archiveTask` del store.

### 6. `src/components/TaskHistory.tsx` (NUEVO)
Crear este componente nuevo. Diseño:

```
┌─────────────────────────────────────────────────┐
│ 📦 Historial de Tareas          12 archivadas   │
├─────────────────────────────────────────────────┤
│ ▶ Preparar informe mensual    Trabajo   15 abr  │
│ ▼ Estudiar para examen        Estudio   12 abr  │
│   ┌──────────────────────────────────────────┐  │
│   │ Prioridad: Alta                          │  │
│   │ Descripción: Estudiar capítulos 5-8...   │  │
│   │ Subtareas: 3/4 completadas               │  │
│   │ [Restaurar]  [Eliminar]                  │  │
│   └──────────────────────────────────────────┘  │
│ ▶ Comprar materiales          Personal  10 abr  │
└─────────────────────────────────────────────────┘
```

**Estructura del componente:**
- Estado local: `expandedId: string | null` para controlar cuál fila está expandida
- Cada fila es clickeable para expandir/colapsar
- Fila colapsada: título + badge categoría + fecha (una sola línea)
- Fila expandida: muestra descripción, prioridad, subtareas, y botones de acción
- Usar iconos `ChevronRight` / `ChevronDown` para indicar expansión
- Usar `Archive`, `RotateCcw` (restaurar), `Trash2` (eliminar) de lucide-react
- Si no hay tareas archivadas, NO mostrar la sección

### 7. `src/components/KanbanBoard.tsx`
Importar y renderizar `<TaskHistory />` debajo del `</DndContext>` y antes de `<TaskModal>`:
```tsx
<TaskHistory />
```

### 8. `src/App.css`
Agregar estilos para la sección de historial:

```css
/* ─── Task History ─── */
.task-history {
  margin-top: var(--space-xl);
  border-top: 1px solid var(--border);
  padding-top: var(--space-lg);
}

.task-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.task-history-header h3 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.task-history-count {
  /* Reutilizar estilo de .kanban-count */
}

.task-history-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

.task-history-item {
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.task-history-item:hover {
  background: var(--bg-hover);
}

.task-history-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: 0.8rem;
}

.task-history-row .chevron {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.task-history-title {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: line-through;
  opacity: 0.7;
}

.task-history-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.task-history-details {
  padding: var(--space-sm) var(--space-md) var(--space-md) calc(var(--space-md) + 24px);
  border-top: 1px solid var(--border);
  animation: slide-down 200ms ease-out;
}

@keyframes slide-down {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 300px; }
}

.task-history-details p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.task-history-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}
```

---

## Columnas del Kanban

**IMPORTANTE**: La columna "Completadas" sigue existiendo normalmente. Las tareas completadas se muestran ahí hasta que el usuario decida archivarlas manualmente. El array `COLUMNS` en `KanbanBoard.tsx` NO cambia. El status `'Archivada'` nunca aparece como columna del Kanban.

## Notas técnicas

- La tabla `tasks` en Supabase ya tiene una columna `status` de tipo texto. No se necesita migración de base de datos, solo agregar el nuevo valor `'Archivada'` al tipo TypeScript.
- El realtime subscription ya escucha cambios en la tabla `tasks`, así que los cambios de status se sincronizarán automáticamente.
- Usar optimistic updates para que la UI sea instantánea.
- Agregar `toast.success('Tarea archivada')` y `toast.success('Tarea restaurada')` para feedback al usuario.
- Los `ConfirmDialog` existente se puede reutilizar para la eliminación permanente desde el historial.

---

## Orden de implementación recomendado

1. Modificar `db.ts` (tipo Status)
2. Modificar `TaskRepository.ts` (interfaz)
3. Modificar `SupabaseRepository.ts` (métodos)
4. Modificar `useTaskStore.ts` (estado y actions)
5. Modificar `TaskCard.tsx` (botón archivar)
6. Crear `TaskHistory.tsx` (componente nuevo)
7. Modificar `KanbanBoard.tsx` (renderizar historial)
8. Agregar estilos en `App.css`
9. Probar flujo completo: completar → archivar → ver en historial → restaurar
