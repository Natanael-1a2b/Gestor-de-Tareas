import { useEffect, useState } from 'react';
import { Plus, Target, Search, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useHabitStore } from '../store/useHabitStore';
import type { Habit } from '../types/habit';
import { HabitTrackerGrid } from '../components/habits/HabitTrackerGrid';
import { HabitAnalytics } from '../components/habits/HabitAnalytics';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { HabitTrashModal } from '../components/habits/HabitTrashModal';
import { TrashDropButton, TRASH_ZONE_ID } from '../components/TrashDropButton';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Habits() {
  const { fetchData, loading, habits, trashedHabits, deleteHabit, reorderHabits } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | undefined>();
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [habitToTrash, setHabitToTrash] = useState<Habit | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenNewModal();
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('.habits-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (over.id === TRASH_ZONE_ID) {
      const habit = habits.find((h) => h.id === active.id);
      if (habit) setHabitToTrash(habit);
      return;
    }

    if (active.id !== over.id) {
      reorderHabits(active.id as string, over.id as string);
    }
  };

  const handleConfirmTrash = async () => {
    if (!habitToTrash) return;
    await deleteHabit(habitToTrash.id);
    setHabitToTrash(null);
  };

  const handleOpenNewModal = () => {
    setEditingHabitId(undefined);
    setIsModalOpen(true);
  };

  const handleEditHabit = (id: string) => {
    setEditingHabitId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="page-container fade-in" style={{ padding: 'max(1rem, 3vw)', maxWidth: '1200px', margin: '0 auto' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.75rem', fontWeight: 'bold' }}>
              <Target size={28} className="text-accent" />
              Seguimiento de Hábitos
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Construye consistencia y alcanza tus metas diarias.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <span className="keyboard-hint" title="Atajo: N">
              <kbd>N</kbd> Nueva
            </span>
            <span className="keyboard-hint" title="Atajo: /">
              <kbd>/</kbd> Buscar
            </span>
            <TrashDropButton onClick={() => setIsTrashModalOpen(true)} count={trashedHabits.length} />
            <button className="btn btn-primary" onClick={handleOpenNewModal} style={{ flexShrink: 0 }}>
              <Plus size={18} style={{ marginRight: '6px' }} />
              Nuevo Hábito
            </button>
          </div>
        </div>

        {!loading && habits.length > 0 && (
          <div className="filter-search" style={{ maxWidth: '360px', marginBottom: '1.5rem' }}>
            <span className="filter-search-icon" aria-hidden="true"><Search size={15} /></span>
            <input
              className="input filter-search-input habits-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar hábitos..."
              aria-label="Buscar hábitos"
            />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} className="spin text-accent" />
          </div>
        ) : (
          <>
            <HabitTrackerGrid onEditHabit={handleEditHabit} searchQuery={search} />
            <HabitAnalytics />
          </>
        )}
      </DndContext>

      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitIdToEdit={editingHabitId}
      />

      <HabitTrashModal isOpen={isTrashModalOpen} onClose={() => setIsTrashModalOpen(false)} />

      <ConfirmDialog
        isOpen={!!habitToTrash}
        title="Mover a la papelera"
        message={`"${habitToTrash?.title}" se moverá a la papelera junto con su historial. Podrás restaurarlo desde ahí antes de que se borre definitivamente en 30 días.`}
        confirmLabel="Mover a la papelera"
        onConfirm={handleConfirmTrash}
        onCancel={() => setHabitToTrash(null)}
      />
    </div>
  );
}
