import { useTaskStore } from '../store/useTaskStore';
import type { Priority, Category, Status } from '../services/db';
import type { SortField, SortDirection } from '../store/useTaskStore';
import { Search, ArrowUp, ArrowDown, X } from 'lucide-react';

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const CATEGORIES: Category[] = ['Ministerio', 'Trabajo', 'Estudio', 'Personal'];
const STATUSES: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Canceladas'];
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Ordenar: Fecha creación' },
  { value: 'dueDate', label: 'Ordenar: Fecha límite' },
  { value: 'priority', label: 'Ordenar: Prioridad' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  'Ministerio': 'var(--cat-ministerio)',
  'Trabajo': 'var(--cat-trabajo)',
  'Estudio': 'var(--cat-estudio)',
  'Personal': 'var(--cat-personal)',
};

const STATUS_LABELS: Record<Status, string> = {
  'Por hacer': 'Por hacer',
  'En proceso': 'En proceso',
  'Completadas': 'Completadas',
  'Canceladas': 'Cancelada o Pospuesta',
};

export function FilterBar() {
  const filters = useTaskStore((s) => s.filters);
  const setFilter = useTaskStore((s) => s.setFilter);
  const resetFilters = useTaskStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.search || filters.category || filters.priority;

  return (
    <div className="filter-bar">
      {/* Leyenda de Categorías */}
      <div className="category-legend">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="category-legend-item">
            <span className="category-legend-dot" style={{ background: CATEGORY_COLORS[cat] }} />
            {cat}
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="filter-search">
        <span className="filter-search-icon" aria-hidden="true"><Search size={15} /></span>
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
          {filters.sortDir === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
        </button>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button className="btn btn-ghost filter-reset" onClick={resetFilters}>
          <X size={13} /> Limpiar
        </button>
      )}
    </div>
  );
}
