import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { BarChart3, CheckCircle2, Clock, AlertCircle, Download, FileText } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { exportToJSON, exportToCSV } from '../services/export';
import type { Status, Task } from '../services/db';

const STATUS_LABELS: Record<Status, string> = {
  'Por hacer': 'Por hacer',
  'En proceso': 'En proceso',
  'Completadas': 'Completadas',
  'Canceladas': 'Cancelada o Pospuesta',
};

const STATUS_COLORS: Record<Status, string> = {
  'Por hacer': '#6366f1',
  'En proceso': '#f59e0b',
  'Completadas': '#10b981',
  'Canceladas': '#ef4444',
};

/* ─── PDF Export ─── */
function exportToPDF(tasks: Task[]) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Tareas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #6366f1; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .stats { display: flex; gap: 24px; margin-bottom: 32px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; }
    .stat-value { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #475569; border-bottom: 2px solid #e2e8f0; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tbody tr:hover { background: #f8fafc; }
    .badge { padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
    .alta { background: #fef2f2; color: #ef4444; }
    .media { background: #fffbeb; color: #f59e0b; }
    .baja { background: #f8fafc; color: #64748b; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <h1>📋 Reporte de Tareas</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value" style="color:#6366f1">${tasks.length}</div><div class="stat-label">Total</div></div>
    <div class="stat"><div class="stat-value" style="color:#10b981">${tasks.filter(t => t.status === 'Completadas').length}</div><div class="stat-label">Completadas</div></div>
    <div class="stat"><div class="stat-value" style="color:#f59e0b">${tasks.filter(t => t.status === 'Por hacer' || t.status === 'En proceso').length}</div><div class="stat-label">Pendientes</div></div>
    <div class="stat"><div class="stat-value" style="color:#ef4444">${tasks.filter(t => { if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false; return new Date(t.dueDate) < new Date(); }).length}</div><div class="stat-label">Vencidas</div></div>
  </div>
  <table>
    <thead><tr><th>Título</th><th>Prioridad</th><th>Categoría</th><th>Estado</th><th>Fecha Límite</th><th>Subtareas</th></tr></thead>
    <tbody>
      ${tasks.map(t => `<tr>
        <td><strong>${t.title}</strong>${t.description ? `<br><span style="color:#94a3b8;font-size:11px">${t.description.slice(0, 80)}${t.description.length > 80 ? '...' : ''}</span>` : ''}</td>
        <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td>${t.category}</td>
        <td>${t.status}</td>
        <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-ES') : '—'}</td>
        <td>${t.subtasks.filter((s: { completed: boolean }) => s.completed).length}/${t.subtasks.length}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">Gestor de Tareas — Reporte generado automáticamente</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 300);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function Dashboard() {
  const { tasks: allTasks } = useTaskStore(useShallow((s) => ({ tasks: s.tasks })));
  const tasks = useTaskStore(useShallow((s) => s.getFilteredTasks()));

  // Métricas
  const total = tasks.length;
  const completadas = tasks.filter((t) => t.status === 'Completadas').length;
  const pendientes = tasks.filter((t) => t.status === 'Por hacer' || t.status === 'En proceso').length;
  const vencidas = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const metrics = [
    { label: 'Total', value: total, icon: BarChart3, color: 'var(--accent)', gradient: 'var(--gradient-accent)', detail: `${porcentaje}% de progreso global` },
    { label: 'Completadas', value: completadas, icon: CheckCircle2, color: 'var(--status-done)', gradient: 'var(--gradient-success)', detail: completadas > 0 ? '¡Buen ritmo!' : 'Aún sin tareas' },
    { label: 'Pendientes', value: pendientes, icon: Clock, color: 'var(--status-progress)', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', detail: 'Requieren tu atención' },
    { label: 'Vencidas', value: vencidas, icon: AlertCircle, color: 'var(--overdue)', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', detail: vencidas > 0 ? 'Prioridad máxima' : '¡Todo al día!' },
  ];

  // Datos para gráfico de barras (distribución por estado)
  const barData = useMemo(() => {
    const statuses: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Canceladas'];
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
          <button className="btn btn-secondary" onClick={() => exportToJSON(allTasks)} disabled={allTasks.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> JSON
          </button>
          <button className="btn btn-secondary" onClick={() => exportToCSV(allTasks)} disabled={allTasks.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-primary" onClick={() => exportToPDF(allTasks)} disabled={allTasks.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="dashboard-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="card dashboard-metric-card" style={{ '--metric-color': m.color, '--metric-gradient': m.gradient } as React.CSSProperties}>
            <div className="dashboard-metric-header">
              <span className="dashboard-metric-label">{m.label}</span>
              <div className="dashboard-metric-icon-box" style={{ background: `${m.color}1A`, color: m.color }} aria-hidden="true">
                <m.icon size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="dashboard-metric-value">{m.value}</div>
            <div className="dashboard-metric-detail">{m.detail}</div>
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
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-md)',
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
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completadas"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
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
