import { useTaskStore } from '../store/useTaskStore';

export function Dashboard() {
  const tasks = useTaskStore((s) => s.tasks);

  const total = tasks.length;
  const completadas = tasks.filter((t) => t.status === 'Completadas').length;
  const pendientes = tasks.filter((t) => t.status === 'Por hacer' || t.status === 'En proceso').length;
  const vencidas = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const metrics = [
    { label: 'Total', value: total, emoji: '📊' },
    { label: 'Completadas', value: completadas, emoji: '✅' },
    { label: 'Pendientes', value: pendientes, emoji: '⏳' },
    { label: 'Vencidas', value: vencidas, emoji: '🔴' },
  ];

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="dashboard-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="card dashboard-metric-card">
            <span className="dashboard-metric-emoji" aria-hidden="true">{m.emoji}</span>
            <span className="dashboard-metric-value">{m.value}</span>
            <span className="dashboard-metric-label">{m.label}</span>
          </div>
        ))}
      </div>
      <p className="dashboard-placeholder">
        Los gráficos de barras y línea se implementarán en la Fase 3.
      </p>
    </div>
  );
}
