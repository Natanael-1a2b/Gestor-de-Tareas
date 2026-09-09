import { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function daysUntilPurge(deletedAt: string): number {
  const purgeAt = new Date(deletedAt).getTime() + THIRTY_DAYS_MS;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function TaskTrashModal({ isOpen, onClose }: Props) {
  const trashedTasks = useTaskStore((s) => s.trashedTasks);
  const restoreFromTrash = useTaskStore((s) => s.restoreFromTrash);
  const permanentlyDeleteTask = useTaskStore((s) => s.permanentlyDeleteTask);
  const emptyTrash = useTaskStore((s) => s.emptyTrash);

  const [taskToPurge, setTaskToPurge] = useState<Task | undefined>();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPurge = async () => {
    if (!taskToPurge?.id) return;
    await permanentlyDeleteTask(taskToPurge.id);
    setTaskToPurge(undefined);
  };

  const handleConfirmEmpty = async () => {
    await emptyTrash();
    setConfirmEmpty(false);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Papelera de tareas</h2>
            <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {trashedTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                La papelera está vacía.
              </p>
            ) : (
              <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm)' }}>
                <button
                  className="btn btn-ghost trash-row-purge"
                  onClick={() => setConfirmEmpty(true)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                  Vaciar papelera
                </button>
              </div>
              <div className="trash-list">
                {trashedTasks.map((task) => (
                  <div key={task.id} className="trash-row">
                    <div className="trash-row-info">
                      <span className="trash-row-title">{task.title}</span>
                      <span className="trash-row-meta">
                        {daysUntilPurge(task.deletedAt!) === 0
                          ? 'Se borra definitivamente hoy'
                          : `Se borra definitivamente en ${daysUntilPurge(task.deletedAt!)} día(s)`}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      aria-label={`Restaurar ${task.title}`}
                      title="Restaurar"
                      onClick={() => restoreFromTrash(task.id!)}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      className="btn btn-ghost trash-row-purge"
                      aria-label={`Eliminar para siempre ${task.title}`}
                      title="Eliminar para siempre"
                      onClick={() => setTaskToPurge(task)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!taskToPurge}
        title="Eliminar para siempre"
        message={`"${taskToPurge?.title}" se va a borrar definitivamente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar para siempre"
        onConfirm={handleConfirmPurge}
        onCancel={() => setTaskToPurge(undefined)}
      />

      <ConfirmDialog
        isOpen={confirmEmpty}
        title="Vaciar papelera"
        message={`Se van a borrar definitivamente las ${trashedTasks.length} tarea(s) de la papelera. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar papelera"
        onConfirm={handleConfirmEmpty}
        onCancel={() => setConfirmEmpty(false)}
      />
    </>
  );
}
