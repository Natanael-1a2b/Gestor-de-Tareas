import { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import type { Habit } from '../../types/habit';
import { ConfirmDialog } from '../ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function daysUntilPurge(deletedAt: string): number {
  const purgeAt = new Date(deletedAt).getTime() + THIRTY_DAYS_MS;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function HabitTrashModal({ isOpen, onClose }: Props) {
  const trashedHabits = useHabitStore((s) => s.trashedHabits);
  const restoreHabit = useHabitStore((s) => s.restoreHabit);
  const permanentlyDeleteHabit = useHabitStore((s) => s.permanentlyDeleteHabit);
  const emptyTrash = useHabitStore((s) => s.emptyTrash);

  const [habitToPurge, setHabitToPurge] = useState<Habit | undefined>();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPurge = async () => {
    if (!habitToPurge) return;
    await permanentlyDeleteHabit(habitToPurge.id);
    setHabitToPurge(undefined);
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
            <h2>Papelera de hábitos</h2>
            <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {trashedHabits.length === 0 ? (
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
                {trashedHabits.map((habit) => (
                  <div key={habit.id} className="trash-row">
                    <div className="trash-row-info">
                      <span className="trash-row-title">{habit.title}</span>
                      <span className="trash-row-meta">
                        {daysUntilPurge(habit.deletedAt!) === 0
                          ? 'Se borra definitivamente hoy'
                          : `Se borra definitivamente en ${daysUntilPurge(habit.deletedAt!)} día(s)`}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      aria-label={`Restaurar ${habit.title}`}
                      title="Restaurar"
                      onClick={() => restoreHabit(habit.id)}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      className="btn btn-ghost trash-row-purge"
                      aria-label={`Eliminar para siempre ${habit.title}`}
                      title="Eliminar para siempre"
                      onClick={() => setHabitToPurge(habit)}
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
        isOpen={!!habitToPurge}
        title="Eliminar para siempre"
        message={`"${habitToPurge?.title}" y todo su historial se van a borrar definitivamente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar para siempre"
        onConfirm={handleConfirmPurge}
        onCancel={() => setHabitToPurge(undefined)}
      />

      <ConfirmDialog
        isOpen={confirmEmpty}
        title="Vaciar papelera"
        message={`Se van a borrar definitivamente los ${trashedHabits.length} hábito(s) de la papelera, junto con su historial. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar papelera"
        onConfirm={handleConfirmEmpty}
        onCancel={() => setConfirmEmpty(false)}
      />
    </>
  );
}
