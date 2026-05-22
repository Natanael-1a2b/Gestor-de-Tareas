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

### 4. Experiencia Premium & PWA
- **Diseño Moderno:** Interfaz pulida, animaciones suaves, micro-interacciones, scroll horizontal táctil y *Glassmorphism*.
- **Modo Offline & PWA:** Instalable en el móvil y escritorio, con *Service Workers* configurados mediante Vite PWA.
- **Responsive Design:** Totalmente adaptable a dispositivos móviles, tablets y escritorio.

## 🛠️ Stack Tecnológico

- **Frontend:** React 18, TypeScript, Vite.
- **Estilos:** Vanilla CSS (CSS Modules / Globales) centrado en variables CSS y diseño minimalista.
- **Estado Global:** Zustand (ligero, rápido y con actualizaciones optimistas).
- **Base de Datos & Auth:** Supabase (PostgreSQL, Row Level Security).
- **Componentes Extra:**
  - `lucide-react` para iconografía moderna.
  - `recharts` para gráficos de datos interactivos.
  - `@dnd-kit/core` & `@dnd-kit/sortable` para Drag & Drop accesible.
  - `date-fns` para la manipulación y formateo avanzado de fechas.
  - `sonner` para notificaciones Toast elegantes.

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
   Crea un archivo `.env` en la raíz del proyecto y añade tus claves de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
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

## 🗄️ Esquema de Base de Datos (Supabase)

El proyecto requiere las siguientes tablas en Supabase:
- `tasks`: Para almacenar las tareas (título, descripción, prioridad, fecha, completada).
- `habits`: Para definir los hábitos a seguir (título, categoría, color, order_index).
- `habit_logs`: Tabla relacional para almacenar el historial (habit_id, date, status).

*(Asegúrate de ejecutar los scripts SQL proporcionados en los planes de implementación para generar las tablas y aplicar RLS).*
