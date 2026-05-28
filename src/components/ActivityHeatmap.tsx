import { useMemo, memo, useEffect, useRef } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityHeatmapProps {
  data: Record<string, number>;
}

export const ActivityHeatmap = memo(function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 182);
    // Ajustar al domingo anterior para alinear la cuadrícula
    const dayOfWeek = start.getDay();
    const adjustedStart = subDays(start, dayOfWeek);
    return eachDayOfInterval({ start: adjustedStart, end });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const heatmapData = useMemo(() => {
    return days.map((day: Date) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: day,
        dateStr,
        count: data[dateStr] || 0
      };
    });
  }, [days, data]);

  // Agrupar meses para las etiquetas superiores
  const months = useMemo(() => {
    const labels: { name: string; colSpan: number }[] = [];
    let currentMonth = '';
    let count = 0;

    days.forEach((day: Date, index: number) => {
      const monthName = format(day, 'MMM', { locale: es });
      if (monthName !== currentMonth) {
        if (currentMonth !== '') {
          labels.push({ name: currentMonth, colSpan: Math.ceil(count / 7) });
        }
        currentMonth = monthName;
        count = 0;
      }
      count++;
      if (index === days.length - 1) {
        labels.push({ name: currentMonth, colSpan: Math.ceil(count / 7) });
      }
    });
    return labels;
  }, [days]);

  const getLevel = (count: number) => {
    if (count === 0) return 'level-0';
    if (count <= 2) return 'level-1';
    if (count <= 4) return 'level-2';
    if (count <= 6) return 'level-3';
    return 'level-4';
  };

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-main">
        {/* Etiquetas de días (L, M, V) */}
        <div className="heatmap-days-labels">
          <span></span>
          <span>Lun</span>
          <span></span>
          <span>Mié</span>
          <span></span>
          <span>Vie</span>
          <span></span>
        </div>

        <div className="heatmap-content" ref={scrollRef}>
          {/* Meses */}
          <div className="heatmap-months">
            {months.map((m, i) => (
              <span key={`${m.name}-${i}`} style={{ gridColumn: `span ${m.colSpan}` }}>
                {m.name}
              </span>
            ))}
          </div>

          {/* Cuadrícula */}
          <div className="heatmap-grid">
            {heatmapData.map((d: { dateStr: string; date: Date; count: number }) => (
              <div
                key={d.dateStr}
                className={`heatmap-cell ${getLevel(d.count)}`}
                title={`${format(d.date, 'dd MMMM', { locale: es })}: ${d.count} tareas`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Menos</span>
        <div className="heatmap-cell level-0"></div>
        <div className="heatmap-cell level-1"></div>
        <div className="heatmap-cell level-2"></div>
        <div className="heatmap-cell level-3"></div>
        <div className="heatmap-cell level-4"></div>
        <span>Más</span>
      </div>
    </div>
  );
});
