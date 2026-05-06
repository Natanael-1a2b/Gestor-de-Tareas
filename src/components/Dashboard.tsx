import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useShallow } from 'zustand/react/shallow';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, LabelList
} from 'recharts';
import { BarChart3, CheckCircle2, Clock, AlertCircle, Download, FileText, Calendar, ChevronRight, Zap } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { exportToJSON, exportToCSV } from '../services/export';
import { toast } from 'sonner';
import { AnimatedNumber } from './AnimatedNumber';
import { ActivityHeatmap } from './ActivityHeatmap';
import { DashboardSkeleton } from './DashboardSkeleton';
import type { Task, Status } from '../types';

const STATUS_LABELS: Record<Status, string> = {
  'Por hacer': 'Por hacer',
  'En proceso': 'En proceso',
  'Completadas': 'Completadas',
  'Canceladas': 'Cancelada o Pospuesta',
  'Archivada': 'Archivada',
};

const STATUS_COLORS: Record<Status, string> = {
  'Por hacer': '#6366f1',
  'En proceso': '#f59e0b',
  'Completadas': '#10b981',
  'Canceladas': '#ef4444',
  'Archivada': '#64748b',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Trabajo': '#3b82f6',     // blue
  'Estudio': '#8b5cf6',     // purple
  'Personal': '#10b981',    // emerald
  'Ministerio': '#f59e0b',  // amber
};

/* ─── PDF Export ─── */
function exportToPDF(tasks: Task[]) {
  try {
    const categories = ['Trabajo', 'Estudio', 'Personal', 'Ministerio'] as const;
    // ... same logic ...
    const catStats = categories.map(cat => ({
      name: cat,
      count: tasks.filter(t => t.category === cat).length,
      percent: tasks.length > 0 ? Math.round((tasks.filter(t => t.category === cat).length / tasks.length) * 100) : 0,
      color: CATEGORY_COLORS[cat]
    })).filter(c => c.count > 0);

    const upcoming = tasks
      .filter(t => t.dueDate && t.status !== 'Completadas' && t.status !== 'Canceladas' && t.status !== 'Archivada')
      .sort((a, b) => new Date(a.dueDate! + 'T12:00:00').getTime() - new Date(b.dueDate! + 'T12:00:00').getTime())
      .slice(0, 5);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Tareas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    h1 { font-size: 26px; margin-bottom: 4px; color: #6366f1; }
    h2 { font-size: 16px; margin-top: 30px; margin-bottom: 15px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .stats { display: flex; gap: 20px; margin-bottom: 32px; }
    .stat { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }
    .stat-value { font-size: 24px; font-weight: 800; }
    .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    
    .cat-item { margin-bottom: 12px; }
    .cat-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 4px; }
    .progress-bg { background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
    
    .upcoming-item { display: flex; justify-content: space-between; font-size: 12px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .overdue { color: #ef4444; font-weight: 700; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
    thead th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: 9px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    tbody td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge { padding: 3px 10px; border-radius: 99px; font-size: 9px; font-weight: 700; display: inline-block; }
    .alta { background: #fef2f2; color: #ef4444; }
    .media { background: #fffbeb; color: #f59e0b; }
    .baja { background: #f0fdf4; color: #10b981; }
    .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>📋 Reporte Ejecutivo de Tareas</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  
  <div class="stats">
    <div class="stat"><div class="stat-value" style="color:#6366f1">${tasks.length}</div><div class="stat-label">Total</div></div>
    <div class="stat"><div class="stat-value" style="color:#10b981">${tasks.filter(t => t.status === 'Completadas').length}</div><div class="stat-label">Completadas</div></div>
    <div class="stat"><div class="stat-value" style="color:#f59e0b">${tasks.filter(t => t.status === 'Por hacer' || t.status === 'En proceso').length}</div><div class="stat-label">Pendientes</div></div>
    <div class="stat"><div class="stat-value" style="color:#ef4444">${tasks.filter(t => { if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false; return new Date(t.dueDate + 'T12:00:00') < new Date(); }).length}</div><div class="stat-label">Vencidas</div></div>
  </div>

  <div class="grid">
    <div>
      <h2>Distribución por Categoría</h2>
      ${catStats.map(c => `
        <div class="cat-item">
          <div class="cat-header">
            <span>${c.name}</span>
            <span>${c.count} (${c.percent}%)</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill" style="width: ${c.percent}%; background-color: ${c.color}"></div>
          </div>
        </div>
      `).join('')}
    </div>
    <div>
      <h2>Próximos Vencimientos</h2>
      ${upcoming.length > 0 ? upcoming.map(t => {
        const d = new Date(t.dueDate + 'T12:00:00');
        const isOverdue = d < new Date();
        return `
          <div class="upcoming-item">
            <span>${t.title}</span>
            <span class="${isOverdue ? 'overdue' : ''}">${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
          </div>
        `;
      }).join('') : '<p style="font-size:12px; color:#94a3b8">No hay tareas urgentes.</p>'}
    </div>
  </div>

  <h2>Detalle Completo de Tareas</h2>
  <table>
    <thead><tr><th style="width:40%">Tarea</th><th>Prioridad</th><th>Categoría</th><th>Estado</th><th>Fecha Límite</th></tr></thead>
    <tbody>
      ${tasks.map(t => `<tr>
        <td><strong>${t.title}</strong>${t.description ? `<br><span style="color:#64748b;font-size:10px">${t.description.slice(0, 100)}${t.description.length > 100 ? '...' : ''}</span>` : ''}</td>
        <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td>${t.category}</td>
        <td>${t.status}</td>
        <td>${t.dueDate ? new Date(t.dueDate + 'T12:00:00').toLocaleDateString('es-ES') : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">Gestor de Tareas — Reporte generado automáticamente el ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => {
          win.print();
          URL.revokeObjectURL(url);
        }, 300);
      };
    } else {
      toast.error('No se pudo abrir la ventana de impresión. Verifica si tienes bloqueadores de ventanas emergentes.');
    }
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    toast.error('Ocurrió un error inesperado al generar el PDF.');
  }
}

export function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('all');

  const { tasks: allTasks, archivedTasks, loading } = useTaskStore(useShallow((s) => ({ 
    tasks: s.tasks, 
    archivedTasks: s.archivedTasks,
    loading: s.loading
  })));
  const baseTasks = useTaskStore(useShallow((s) => s.getFilteredTasks()));

  const tasks = useMemo(() => {
    if (timeFilter === 'all') return baseTasks;
    const past = new Date();
    if (timeFilter === 'week') past.setDate(past.getDate() - 7);
    if (timeFilter === 'month') past.setMonth(past.getMonth() - 1);
    
    return baseTasks.filter(t => {
      const created = new Date(t.createdAt);
      const isCreatedRecent = created >= past;
      const isDueRecent = t.dueDate ? new Date(t.dueDate + 'T12:00:00') >= past : false;
      return isCreatedRecent || isDueRecent;
    });
  }, [baseTasks, timeFilter]);

  // Métricas consolidando el historial
  const totalHistorico = allTasks.length + archivedTasks.length;
  const completadasHistorico = allTasks.filter(t => t.status === 'Completadas').length + archivedTasks.length;
  
  const total = tasks.length; // Para el gráfico actual filtrado
  const pendientes = allTasks.filter((t) => t.status === 'Por hacer' || t.status === 'En proceso').length;
  const vencidas = allTasks.filter((t) => {
    if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas' || t.status === 'Archivada') return false;
    return new Date(t.dueDate + 'T12:00:00') < new Date();
  }).length;

  const porcentaje = totalHistorico > 0 ? Math.round((completadasHistorico / totalHistorico) * 100) : 0;



  const metrics = [
    { label: 'Total', value: totalHistorico, icon: BarChart3, color: 'var(--accent)', gradient: 'var(--gradient-accent)', detail: 'Tareas en todo el historial' },
    { label: 'Eficiencia', value: porcentaje, icon: Zap, color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', detail: `${porcentaje}% tasa de éxito histórica`, unit: '%' },
    { label: 'Completadas', value: completadasHistorico, icon: CheckCircle2, color: 'var(--status-done)', gradient: 'var(--gradient-success)', detail: `${completadasHistorico} metas alcanzadas` },
    { label: 'Pendientes', value: pendientes, icon: Clock, color: 'var(--status-progress)', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', detail: 'Requieren atención hoy' },
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

  // Unificar todas las tareas (activas + archivadas) para métricas históricas
  const historicalTasks = useMemo(() => [...allTasks, ...archivedTasks], [allTasks, archivedTasks]);

  // Datos para gráfico de dona (categorías) - Basado en tareas filtradas por tiempo
  const pieData = useMemo(() => {
    const categories = ['Trabajo', 'Estudio', 'Personal', 'Ministerio'];
    return categories.map(cat => ({
      name: cat,
      value: tasks.filter(t => t.category === cat).length
    })).filter(d => d.value > 0);
  }, [tasks]);

  // Datos para gráfico de línea (productividad: tareas completadas por día de los últimos 14 días)
  const lineData = useMemo(() => {
    // Filtrar tareas completadas de TODO el historial
    const completed = historicalTasks.filter((t) => 
      (t.status === 'Completadas' || t.status === 'Archivada') && (t.completedAt || t.createdAt)
    );
    
    const byDay = new Map<string, number>();

    // Inicializar últimos 14 días
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }

    completed.forEach((t) => {
      const dateSource = t.completedAt || t.createdAt;
      const day = dateSource.slice(0, 10);
      if (byDay.has(day)) {
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
    });

    return Array.from(byDay.entries()).map(([date, count]) => ({
      fecha: format(new Date(date + 'T12:00:00'), 'dd MMM', { locale: es }),
      completadas: count,
    }));
  }, [historicalTasks]);

  // Próximos vencimientos
  const upcomingTasks = useMemo(() => {
    return allTasks
      .filter(t => t.dueDate && t.status !== 'Completadas' && t.status !== 'Canceladas' && t.status !== 'Archivada')
      .sort((a, b) => new Date(a.dueDate! + 'T12:00:00').getTime() - new Date(b.dueDate! + 'T12:00:00').getTime())
      .slice(0, 4);
  }, [allTasks]);

  // Heatmap Data
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    
    // Tareas activas completadas
    allTasks.forEach(t => {
      if (t.status === 'Completadas') {
        const date = format(new Date(t.completedAt || t.createdAt), 'yyyy-MM-dd');
        data[date] = (data[date] || 0) + 1;
      }
    });

    // Tareas archivadas
    archivedTasks.forEach(t => {
      const date = format(new Date(t.completedAt || t.createdAt), 'yyyy-MM-dd');
      data[date] = (data[date] || 0) + 1;
    });

    return data;
  }, [allTasks, archivedTasks]);

  if (loading && allTasks.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <h2>Dashboard</h2>
        <div className="dashboard-top-actions">
          {/* Selector de Rango */}
          <div className="time-filter-tabs">
            <button className={timeFilter === 'week' ? 'active' : ''} onClick={() => setTimeFilter('week')}>7 Días</button>
            <button className={timeFilter === 'month' ? 'active' : ''} onClick={() => setTimeFilter('month')}>30 Días</button>
            <button className={timeFilter === 'all' ? 'active' : ''} onClick={() => setTimeFilter('all')}>Siempre</button>
          </div>

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
            <div className="dashboard-metric-value">
              <AnimatedNumber value={m.value} />{m.unit && <span className="unit">{m.unit}</span>}
            </div>
            <div className="dashboard-metric-detail">{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Gráficos y Widgets */}
      <div className="dashboard-grid">
        
        {/* 1. Dona: Categorías (Izquierda) */}
        {tasks.length > 0 && (
          <div className="card dashboard-chart pie-widget card-enter" style={{ gridColumn: 'span 4', height: '100%', minHeight: '380px' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Categorías</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart key={timeFilter}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                  {pieData.map(d => {
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div key={d.name} className="pie-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                        <span className="pie-legend-color" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[d.name] }}></span>
                        <span className="pie-legend-label" style={{ color: 'var(--text-secondary)' }}>{d.name} ({d.value} · {pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="dashboard-placeholder">Sin datos en este periodo</p>
              </div>
            )}
          </div>
        )}

        {/* 2. Heatmap: Actividad (CENTRO) */}
        <div className="card dashboard-chart heatmap-widget card-enter" style={{ gridColumn: 'span 4', animationDelay: '0.1s', height: '100%', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="widget-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem' }}><BarChart3 size={14} /> Actividad</h3>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ActivityHeatmap data={heatmapData} />
          </div>
        </div>

        {/* 3. Barras: distribución por estado (Derecha) */}
        {tasks.length > 0 && (
          <div className="card dashboard-chart bar-widget card-enter" style={{ gridColumn: 'span 4', animationDelay: '0.2s', height: '100%', minHeight: '380px' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Estados</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart key={timeFilter} data={barData} margin={{ top: 20, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out">
                  <LabelList dataKey="cantidad" position="top" fill="var(--text-primary)" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Próximos Vencimientos (Ocupa el resto o nueva fila) */}
        <div className="card dashboard-widget upcoming-widget" style={{ gridColumn: 'span 12' }}>
          <div className="widget-header">
            <h3><Calendar size={16} /> Próximos Vencimientos</h3>
          </div>
          <div className="widget-body">
            {upcomingTasks.length > 0 ? (
              <ul className="upcoming-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {upcomingTasks.map(t => {
                  const date = new Date(t.dueDate! + 'T12:00:00');
                  const isOverdue = date < new Date();
                  return (
                    <li key={t.id} className="upcoming-item">
                      <div className="upcoming-item-info">
                        <span className="upcoming-title">{t.title}</span>
                        <span className={`upcoming-date ${isOverdue ? 'overdue' : ''}`}>
                          {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <ChevronRight size={14} className="upcoming-icon" />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="upcoming-empty">
                <CheckCircle2 size={24} />
                <p>No hay tareas urgentes.</p>
              </div>
            )}
          </div>
        </div>



        {/* Línea: productividad */}
        {tasks.length > 0 && (
          <div className={`card dashboard-chart line-widget card-enter`} style={{ animationDelay: '0.2s' }}>
            <h3>Productividad (últimos 14 días)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart key={timeFilter} data={lineData} margin={{ top: 24, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
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
                  stroke="var(--status-done)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--status-done)', strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                >
                  <LabelList dataKey="completadas" position="top" fill="var(--text-primary)" fontSize={13} fontWeight="bold" offset={10} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {tasks.length === 0 && (
        <p className="dashboard-placeholder" style={{ marginTop: 'var(--space-2xl)' }}>
          No hay tareas en el rango de fechas seleccionado.
        </p>
      )}
    </div>
  );
}
