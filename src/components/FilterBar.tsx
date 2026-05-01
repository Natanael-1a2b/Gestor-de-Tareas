import { useTaskStore } from '../store/useTaskStore';
import type { Priority, Category, Status } from '../services/db';
import type { SortField, SortDirection } from '../store/useTaskStore';

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const CATEGORIES: Category[] = ['Ministerio', 'Trabajo', 'Estudio', 'Personal'];
const STATUSES: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Pospuestas', 'Canceladas'];
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'dueDate', label: 'Fecha límite' },
  { value: 'priority', label: 'Prioridad' },
];

export function FilterBar() {
  const filters = useTaskStore((s) => s.filters);
  const setFilter = useTaskStore((s) => s.setFilter);
  const resetFilters = useTaskStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.search || filters.category || filters.priority || filters.status;

  return (
    <div className="filter-bar">
      {/* Búsqueda */}
      <div className="filter-search">
        <span className="filter-search-icon" aria-hidden="true">🔍</span>
        <input
          className="input filter-search-input"
          type="text"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Buscar por título..."
          aria-label="Buscar tareas"
        />
      </div>

      {/* Filtros */}
      <div className="filter-selects">
        <select
          className="input filter-select"
          value={filters.category ?? ''}
          onChange={(e) => setFilter('category', (e.target.value as Category) || null)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Categoría</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="input filter-select"
          value={filters.priority ?? ''}
          onChange={(e) => setFilter('priority', (e.target.value as Priority) || null)}
          aria-label="Filtrar por prioridad"
        >
          <option value="">Prioridad</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="input filter-select"
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', (e.target.value as Status) || null)}
          aria-label="Filtrar por estado"
        >
          <option value="">Estado</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Ordenamiento */}
        <select
          className="input filter-select"
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value as SortField)}
          aria-label="Ordenar por"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          className="btn btn-ghost filter-dir"
          onClick={() => setFilter('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc' as SortDirection)}
          aria-label={`Orden ${filters.sortDir === 'asc' ? 'ascendente' : 'descendente'}`}
          title={filters.sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
        >
          {filters.sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button className="btn btn-ghost filter-reset" onClick={resetFilters}>
          ✕ Limpiar
        </button>
      )}
    </div>
  );
}
