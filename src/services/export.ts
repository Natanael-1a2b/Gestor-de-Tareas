import type { Task } from '../types';
import { toast } from 'sonner';

export function exportToJSON(tasks: Task[]): void {
  try {
    const data = JSON.stringify(tasks, null, 2);
    downloadFile(data, 'tareas.json', 'application/json');
    toast.success('Exportación JSON exitosa');
  } catch (error) {
    console.error('Error al exportar JSON:', error);
    toast.error('Error al exportar a JSON');
  }
}

export function exportToCSV(tasks: Task[]): void {
  try {
    const headers = ['ID', 'Título', 'Descripción', 'Prioridad', 'Categoría', 'Estado', 'Fecha Límite', 'Subtareas', 'Creado'];
    const rows = tasks.map((t) => [
      t.id ?? '',
      escapeCSV(t.title),
      escapeCSV(t.description),
      t.priority,
      t.category,
      t.status,
      t.dueDate ?? '',
      `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`,
      t.createdAt,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, 'tareas.csv', 'text/csv');
    toast.success('Exportación CSV exitosa');
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    toast.error('Error al exportar a CSV');
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
