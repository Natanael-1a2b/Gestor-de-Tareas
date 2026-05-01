import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useTaskStore } from '../store/useTaskStore';
import { exportToJSON, exportToCSV } from '../services/export';
import type { Status } from '../services/db';

const STATUS_LABELS: Record<Status, string> = {
  'Por hacer': 'Por hacer',
  'En proceso': 'En proceso',
  'Completadas': 'Completadas',
  'Pospuestas': 'Pospuestas',
  'Canceladas': 'Canceladas',
};

const STATUS_COLORS: Record<Status, string> = {
  'Por hacer': '#6366f1',
  'En proceso': '#f59e0b',
  'Completadas': '#10b981',
  'Pospuestas': '#8b5cf6',
  'Canceladas': '#ef4444',
};

export function Dashboard() {
  const tasks = useTaskStore((s) => s.tasks);

  // Métricas
  const total = tasks.length;
  const completadas = tasks.filter((t) => t.status === 'Completadas').length;
  const pendientes = tasks.filter((t) => t.status === 'Por hacer' || t.status === 'En proceso').length;
  const vencidas = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const metrics = [
    { label: 'Total', value: total, emoji: '📊', color: '#6366f1' },
    { label: 'Completadas', value: completadas, emoji: '✅', color: '#10b981' },
    { label: 'Pendientes', value: pendientes, emoji: '⏳', color: '#f59e0b' },
    { label: 'Vencidas', value: vencidas, emoji: '🔴', color: '#ef4444' },
  ];

  // Datos para gráfico de barras (distribución por estado)
  const barData = useMemo(() => {
    const statuses: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Pospuestas', 'Canceladas'];
    return statuses.map((status) => ({
      name: STATUS_LABELS[status],
      cantidad: tasks.filter((t) => t.status === status).length,
      fill: STATUS_COLORS[status],
    }));
  }, [tasks]);

  // Datos para gráfico de línea (productividad: tareas completadas por día)
  const lineData = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'Completadas' && t.createdAt);
    const byDay = new Map<string, number>();

    // Últimos 14 días
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }

    completed.forEach((t) => {
      const day = t.createdAt.slice(0, 10);
      if (byDay.has(day)) {
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
    });

    return Array.from(byDay.entries()).map(([date, count]) => ({
      fecha: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      completadas: count,
    }));
  }, [tasks]);

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <h2>Dashboard</h2>
        <div className="dashboard-export">
          <button className="btn btn-secondary" onClick={() => exportToJSON(tasks)} disabled={tasks.length === 0}>
            📥 JSON
          </button>
          <button className="btn btn-secondary" onClick={() => exportToCSV(tasks)} disabled={tasks.length === 0}>
            📥 CSV
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="dashboard-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="card dashboard-metric-card">
            <span className="dashboard-metric-emoji" aria-hidden="true">{m.emoji}</span>
            <span className="dashboard-metric-value" style={{ color: m.color }}>{m.value}</span>
            <span className="dashboard-metric-label">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {tasks.length > 0 ? (
        <div className="dashboard-charts">
          {/* Barras: distribución por estado */}
          <div className="card dashboard-chart">
            <h3>Distribución por Estado</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Línea: productividad */}
          <div className="card dashboard-chart">
            <h3>Productividad (últimos 14 días)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completadas"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--accent)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="dashboard-placeholder">
          Crea tareas para ver los gráficos de productividad.
        </p>
      )}
    </div>
  );
}
