import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import { Flame, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { isHabitScheduledOnDate } from '../../utils/habitFrequency';
import './HabitAnalytics.css';
import { format, subDays } from 'date-fns';

export function HabitAnalytics() {
  const { habits, logs } = useHabitStore();

  const stats = useMemo(() => {
    let totalCompleted = 0;
    let totalPossible = 0;
    const chartData: any[] = [];
    
    // Calcular últimos 30 días para stats
    const today = new Date();
    const last30Days = Array.from({ length: 30 }).map((_, i) => format(subDays(today, 29 - i), 'yyyy-MM-dd'));

    let bestStreakAllTime = 0;
    let currentGlobalStreak = 0;

    habits.forEach(habit => {
      let habitCompleted30 = 0;
      let habitCurrentStreak = 0;
      let habitBestStreak = 0;
      let currentStreakTemp = 0;

      last30Days.forEach(date => {
        const isScheduled = isHabitScheduledOnDate(habit, date);
        if (!isScheduled) return; // Si no tocaba, no afecta la estadística ni rompe racha

        totalPossible++;
        const status = logs[habit.id]?.[date] || 'none';
        if (status === 'completed') {
          totalCompleted++;
          habitCompleted30++;
          currentStreakTemp++;
          if (currentStreakTemp > habitBestStreak) habitBestStreak = currentStreakTemp;
        } else {
          currentStreakTemp = 0;
        }
      });
      habitCurrentStreak = currentStreakTemp;

      if (habitBestStreak > bestStreakAllTime) bestStreakAllTime = habitBestStreak;
      currentGlobalStreak += habitCurrentStreak;

      chartData.push({
        name: habit.title.length > 18 ? habit.title.substring(0, 15) + '...' : habit.title,
        completados: habitCompleted30,
        color: habit.color,
        fullTitle: habit.title // For tooltip
      });
    });

    // Ordenar de mayor a menor constancia
    chartData.sort((a, b) => b.completados - a.completados);

    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      completionRate,
      chartData,
      bestStreak: bestStreakAllTime,
      totalCompleted
    };
  }, [habits, logs]);

  if (habits.length === 0) return null;

  return (
    <div className="habit-analytics">
      <div className="analytics-cards">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--priority-media-bg)', color: 'var(--priority-media)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completitud (30 días)</span>
            <span className="stat-value">{stats.completionRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--priority-alta-bg)', color: 'var(--priority-alta)' }}>
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Mejor Racha (días)</span>
            <span className="stat-value">{stats.bestStreak}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--priority-baja-bg)', color: 'var(--priority-baja)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Completados</span>
            <span className="stat-value">{stats.totalCompleted}</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Ranking de Constancia (últimos 30 días)</h3>
        <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
          <ResponsiveContainer>
            <BarChart data={stats.chartData} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
              <defs>
                {stats.chartData.map((entry, index) => (
                  <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} angle={-45} textAnchor="end" interval={0} tickMargin={8} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: 'var(--bg-glass-strong)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{data.fullTitle}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0 0 0' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: data.color }}></div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{payload[0].value}</strong> días logrados
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completados" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500}>
                {stats.chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} />
                ))}
                <LabelList dataKey="completados" position="top" fill="var(--text-primary)" fontSize={11} fontWeight={600} offset={8} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
