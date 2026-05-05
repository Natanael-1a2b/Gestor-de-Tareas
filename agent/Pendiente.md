# Mejoras Pendientes - Gestor de Tareas

## Críticas (Alta prioridad)

### 1. Eliminar `fetchTasks()` innecesario en `addTask`
**Archivo:** `src/store/useTaskStore.ts:127-128`
**Problema:** Ya se hace optimistic update, recargar todas las tareas es redundante y costoso.
**Solución:** Eliminar las líneas:
```typescript
const tasks = await taskRepository.getAll();
set({ tasks });
```

### 2. Arreglar `toggleSubtassi k` en el repositorio
**Archivo:** `src/services/SupabaseRepository.ts:119-133`
**Problema:** El fetch-then-update puede causar race conditions.
**Solución:** Usar RPC o un update directo con la lógica en la BD:
```typescript
async toggleSubtask(_taskId: string, subtaskId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_subtask', { subtask_id: subtaskId });
  if (error) throw error;
}
```
*Nota: Requiere crear la función RPC en Supabase.*

### 3. Manejo de errores en Auth centralizado
**Archivo:** `src/pages/Auth.tsx:57-72`
**Problema:** Los errores se traducen manualmente; código duplicado si se usa en otros lugares.
**Solución:** Crear un helper en `src/services/errorHandler.ts`:
```typescript
export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Ocurrió un error desconocido.';
  
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Credenciales inválidas. Verifica tu correo y contraseña.';
  if (msg.includes('user already registered')) return 'Este correo ya está registrado.';
  if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('email not confirmed')) return 'Por favor confirma tu correo electrónico antes de iniciar sesión.';
  if (msg.includes('invalid format') || msg.includes('valid email')) return 'Por favor ingresa un correo electrónico válido.';
  if (msg.includes('rate limit') || msg.includes('too many requests')) return 'Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  
  return error.message;
}
```

### 4. Variable `realtimeChannel` fuera del store
**Archivo:** `src/store/useTaskStore.ts:67`
**Problema:** Variable global fuera del estado de Zustand puede causar fugas y problemas de testing.
**Solución:** Mover dentro del estado:
```typescript
interface TaskState {
  // ... otros campos
  realtimeChannel: RealtimeChannel | null;
  // ...
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // ...
  realtimeChannel: null,
  
  subscribeToRealtime: () => {
    const channel = get().realtimeChannel;
    if (channel) return;
    
    const newChannel = supabase.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        get().fetchTasks(true);
      })
      .subscribe();
    
    set({ realtimeChannel: newChannel });
  },
  
  unsubscribeFromRealtime: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },
  // ...
}));
```

## Importantes (Media prioridad)

### 5. Agregar paginación en `getAll()`
**Archivo:** `src/services/SupabaseRepository.ts:10`
**Problema:** Carga todas las tareas sin límites.
**Solución:** Implementar paginación:
```typescript
async getAll(page: number = 1, pageSize: number = 20): Promise<Task[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return (data || []).map(this.mapToClient);
}
```

### 6. Implementar soporte offline con Dexie
**Archivo:** `src/services/db.ts` (actualmente no usado)
**Problema:** Dexie está definido pero no se usa.
**Solución:** Crear un repositorio híbrido:
- Leer/escribir localmente con Dexie
- Sincronizar con Supabase cuando hay conexión
- Usar el repositorio offline como fallback

### 7. Separar tipos de BD y UI
**Archivo:** `src/services/db.ts:13-23`
**Problema:** Interfaz `Task` tiene campos opcionales innecesarios.
**Solución:** 
```typescript
// Tipos de BD (Supabase/Dexie)
export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  due_date: string | null;
  created_at: string;
}

// Tipos de UI
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  category: Category;
  status: Status;
  subtasks: Subtask[];
  createdAt: string;
}
```

### 8. Agregar Loading states para subtareas
**Archivo:** `src/store/useTaskStore.ts`
**Problema:** Los botones de subtareas no muestran feedback visual durante operaciones async.
**Solución:** Agregar estado de carga por subtarea:
```typescript
interface TaskState {
  // ...
  loadingSubtasks: Record<string, boolean>;
  // ...
}
```

## Menores (Baja prioridad)

### 9. Implementar reset de contraseña nativo de Supabase
**Archivo:** `src/pages/Auth.tsx:127`
**Problema:** Usa Formspree externo.
**Solución:** 
```typescript
const handleResetPassword = async () => {
  if (!email) {
    toast.error('Ingresa tu correo para restablecer la contraseña.');
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });
  if (error) toast.error(getAuthErrorMessage(error));
  else toast.success('Revisa tu correo para restablecer tu contraseña.');
};
```

### 10. Memorizar `getFilteredTasks`
**Archivo:** `src/store/useTaskStore.ts:271`
**Problema:** Se ejecuta en cada render.
**Solución:** Usar selector memoizado o Zustand middleware:
```typescript
// En el componente
import { useMemo } from 'react';
// ...
const tasks = useTaskStore(state => state.tasks);
const filters = useTaskStore(state => state.filters);
const filteredTasks = useMemo(() => {
  return useTaskStore.getState().getFilteredTasks();
}, [tasks, filters]);
```

### 11. Mejorar validación de variables de entorno
**Archivo:** `src/services/supabase.ts:6-8`
**Problema:** El warning no detiene la ejecución.
**Solución:**
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local");
}
```

### 12. Agregar tests
**Faltante:** No hay tests unitarios ni de integración.
**Solución:** Configurar Vitest y crear tests para:
- Stores (useTaskStore, useAuthStore)
- Servicios (SupabaseRepository)
- Componentes críticos (KanbanBoard, TaskCard)

---
**Fecha de análisis:** 2 de mayo de 2026
**Prioridad recomendada:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
