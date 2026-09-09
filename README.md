# Gestor de Tareas y Hábitos

Una aplicación web progresiva (PWA) premium para la gestión integral de productividad, combinando el seguimiento de tareas pendientes con un completo sistema de creación y seguimiento de hábitos diarios.

## 🚀 Características Principales

### 1. Gestión de Tareas (To-Do List)
- **Sistema de Prioridades:** Alta (Rojo), Media (Amarillo) y Baja (Azul).
- **Categorización:** Organiza tareas por Etiquetas/Categorías (Trabajo, Personal, Salud, etc.).
- **Fechas de Vencimiento:** Asigna fechas límite a tus tareas.
- **Filtros Avanzados:** Filtra por estado (Pendientes/Completadas), prioridad, categoría y rangos de fechas.

### 2. Vista de Calendario
- Visualiza tus tareas pendientes y completadas distribuidas en un calendario mensual interactivo.
- Permite ver rápidamente la carga de trabajo de cada día.

### 3. Seguimiento de Hábitos (Habit Tracker)
- **Grid Interactivo:** Un diseño tipo *Contribution Graph* (Bullet Journal) con vistas semanales y mensuales.
- **Estados Rápidos:** Marca tus hábitos como ✅ Completados, ❌ Saltados o ⬜ Pendientes con un solo clic.
- **Organización Flexible:** Reordena tus hábitos libremente usando **Drag & Drop** (`@dnd-kit`).
- **Analíticas Avanzadas:** Gráfico de barras premium (Glassmorphism) que muestra tu "Ranking de Constancia", mejor racha y porcentaje de completitud.

### 4. Notas
- **CRUD Completo:** Crea, edita y elimina notas con título y contenido.
- **Favoritas:** Marca notas como favoritas con un toggle animado para acceso rápido.
- **Búsqueda:** Filtra notas en tiempo real por título o contenido.
- **Agrupación por Día:** Las notas se organizan automáticamente por fecha de creación.
- **Carpetas visuales:** Organiza notas en carpetas con color, con drag-and-drop para mover notas entre ellas.
- **Copiar Contenido:** Copia el contenido de una nota al portapapeles con un solo clic.
- **Notas-enlace (opcional):** en Ajustes se puede activar que, si el contenido de una nota es únicamente una URL, hacer clic en ella abra el enlace directo en vez de editarla (en PC se sigue editando con el botón de lápiz; en mobile hay un botón aparte para abrir el link).

### 5. Ajustes
- **Tema:** Claro, Oscuro o Rosado, guardado en el dispositivo.
- **Notificaciones push:** Aviso cuando una tarea está próxima a vencer (Web Push + Service Worker), con anticipación configurable.

### 6. Experiencia Premium & PWA
- **Diseño Moderno:** Interfaz pulida, animaciones suaves, micro-interacciones, scroll horizontal táctil y *Glassmorphism*.
- **Modo Offline & PWA:** Instalable en el móvil y escritorio, con *Service Workers* configurados mediante Vite PWA (`vite-plugin-pwa`, estrategia `injectManifest`).
- **Actualizaciones controladas por el usuario:** cuando hay una versión nueva, aparece un aviso con las novedades (`src/data/changelog.ts`) y un botón para actualizar — nunca se recarga la página sin avisar.
- **Responsive Design:** Totalmente adaptable a dispositivos móviles, tablets y escritorio.

### 7. Panel de Administración
- **Allowlist en base de datos:** el acceso de admin se controla con la tabla `admin_users` (no con un email hardcodeado).
- **Gestión de usuarios:** editar correo o eliminar una cuenta (borrado en cascada de sus tareas, hábitos, notas, etc.).
- **Auditoría:** registro de qué admin hizo qué acción y cuándo (`admin_audit_log`).
- **Aviso push manual:** enviar una notificación a todos los dispositivos con la app instalada (por ejemplo, para avisar de un cambio importante).

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, TypeScript, Vite.
- **Estilos:** Vanilla CSS (CSS Modules / Globales) centrado en variables CSS y diseño minimalista.
- **Estado Global:** Zustand (ligero, rápido y con actualizaciones optimistas).
- **Base de Datos & Auth:** Supabase (PostgreSQL, Row Level Security).
- **PWA:** `vite-plugin-pwa` (estrategia `injectManifest`) + Service Worker propio (`src/sw.ts`) para offline, push notifications y actualizaciones controladas.
- **Backend serverless:** Funciones de Vercel en `api/` (Node) para acciones que requieren la `service_role` key de Supabase (admin, push, notificaciones).
- **Notificaciones Push:** `web-push` (servidor) + Web Push API (cliente), con claves VAPID.
- **Componentes Extra:**
  - `lucide-react` para iconografía moderna.
  - `recharts` para gráficos de datos interactivos.
  - `@dnd-kit/core` & `@dnd-kit/sortable` para Drag & Drop accesible.
  - `date-fns` para la manipulación y formateo avanzado de fechas.
  - `sonner` para notificaciones Toast elegantes.

## 🧩 Arquitectura y Módulos del Sistema

El proyecto está organizado en los siguientes módulos principales de React:

### 🔐 Autenticación & Administración
Maneja el inicio de sesión, registro, protección de rutas y el panel de control para administradores.
*   **Páginas principales:** `Auth.tsx`, `AdminDashboard.tsx`, `AuthGuard.tsx`
*   **Estado:** `useAuthStore.ts`

### 📋 Gestión de Tareas (Core & Kanban)
Permite crear, editar, filtrar y organizar tareas mediante Drag & Drop, así como ver historial y métricas en el Dashboard.
*   **Componentes Principales:** `KanbanBoard.tsx`, `TaskCard.tsx`, `TaskModal.tsx`, `TaskHistory.tsx`
*   **Dashboard & Filtros:** `Dashboard.tsx`, `FilterBar.tsx`
*   **Estado:** `useTaskStore.ts`

### 📅 Calendario & Vistas de Tiempo
Permite visualizar las tareas programadas y eventos distribuidos a través del mes, semana o año.
*   **Componentes Principales:** `CalendarView.tsx`, `MonthView.tsx`, `WeekView.tsx`, `YearView.tsx`, `DayTaskList.tsx`

### 🌱 Gestor de Hábitos
Módulo para registrar y dar seguimiento a hábitos diarios, semanales o por intervalos con estadísticas detalladas.
*   **Página/Componentes:** `Habits.tsx`, `HabitAnalytics.tsx`, `HabitFormModal.tsx`, `HabitTrackerGrid.tsx`, `SortableHabitRow.tsx`
*   **Estado:** `useHabitStore.ts`

### 📝 Notas
Módulo para crear y organizar notas rápidas, con favoritos, búsqueda, carpetas y agrupación por día.
*   **Página/Componentes:** `Notes.tsx`, `NoteFormModal.tsx`, `FolderFormModal.tsx`, `FolderManagerModal.tsx`
*   **Estado:** `useNoteStore.ts`, `useNoteFolderStore.ts`, `useNoteLinkPreferenceStore.ts`

### ⚙️ Ajustes & PWA
Preferencias del usuario (tema, notificaciones, notas-enlace) y el aviso de actualización de la app.
*   **Página/Componentes:** `Settings.tsx`, `ThemeCard.tsx`, `PushNotificationCard.tsx`, `NoteLinksCard.tsx`, `ReloadPrompt.tsx`
*   **Estado:** `useThemeStore.ts`, `useNotificationStore.ts`
*   **Novedades por versión:** `src/data/changelog.ts` (se actualiza a mano con cada cambio visible para el usuario)

### 🔧 API Serverless (`api/`)
Funciones de Vercel que necesitan la `service_role` key de Supabase (nunca expuesta al cliente): gestión de usuarios/admin, auditoría, suscripciones y envío de push, y el cron diario de tareas próximas a vencer.
*   **Endpoints:** `users.ts`, `admin-audit.ts`, `admin-broadcast-push.ts`, `push-subscriptions.ts`, `notification-settings.ts`, `cron/notify-due-tasks.ts`
*   **Helpers compartidos:** `_lib/verifyUser.ts`, `_lib/supabaseAdmin.ts`, `_lib/isAdmin.ts`, `_lib/webpush.ts`

### ⚙️ Servicios & Repositorios (Supabase)
Capa de conexión y persistencia de datos hacia PostgreSQL (Supabase).
*   **Servicios y Repositorios:** `supabase.ts`, `SupabaseRepository.ts`, `TaskRepository.ts`, `HabitRepository.ts`, `NoteRepository.ts`, `NoteFolderRepository.ts`, `NotificationRepository.ts`, `adminService.ts`

## 📦 Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Natanael-1a2b/Gestor-de-Tareas.git
   cd Gestor-de-Tareas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

   # Solo necesarias para correr las funciones serverless de api/ en local
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   VITE_VAPID_PUBLIC_KEY=tu_clave_publica_vapid
   VAPID_PRIVATE_KEY=tu_clave_privada_vapid
   VAPID_CONTACT_EMAIL=tu_email_de_contacto
   CRON_SECRET=un_secreto_para_proteger_el_cron_de_notificaciones
   ```

4. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 🚀 Compilación para Producción

Para generar una versión optimizada de la aplicación (lista para Vercel, Netlify, etc.):
```bash
npm run build
```
Los archivos minificados y los *Service Workers* se generarán en la carpeta `dist/`.

**Producción:** [https://gestor-de-tareas-3uce.vercel.app/](https://gestor-de-tareas-3uce.vercel.app/) — este es el dominio correcto del proyecto en Vercel. *(Nota: `gestor-de-tareas.vercel.app`, sin el sufijo, es un proyecto de otra persona sin relación con este repo — no instalar la PWA desde ahí).*

## 🗄️ Esquema de Base de Datos (Supabase)

El proyecto requiere las siguientes tablas en Supabase:
- `tasks`: Para almacenar las tareas (título, descripción, prioridad, fecha, completada).
- `habits`: Para definir los hábitos a seguir (título, categoría, color, order_index).
- `habit_logs`: Tabla relacional para almacenar el historial (habit_id, date, status).
- `notes`: Para almacenar las notas (título, contenido, favorito, folder_id, fechas de creación/actualización).
- `note_folders`: Carpetas de notas (nombre, color).
- `admin_users`: Allowlist de administradores (`user_id` → `auth.users`).
- `admin_audit_log`: Auditoría de acciones de admin (editar correo, eliminar usuario).
- `notification_settings`: Preferencia de notificaciones push por usuario (activado, días de anticipación).
- `push_subscriptions`: Suscripciones Web Push por dispositivo.
- `task_due_notifications`: Registro de qué tareas ya generaron un push, para no duplicar avisos.

`tasks`, `habits`, `habit_logs` y `notes` se crearon directo en el dashboard de Supabase (no están trackeadas como SQL en el repo). El resto de las tablas sí tienen su script en `supabase/sql/` — córrelos manualmente en el SQL Editor de Supabase (no hay migraciones automatizadas en este repo). Todas las tablas de usuario tienen `ON DELETE CASCADE` desde `auth.users`, así que eliminar un usuario desde el Panel de Administración borra en cascada todos sus datos.
