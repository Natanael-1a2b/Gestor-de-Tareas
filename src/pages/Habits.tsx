import { useEffect, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';
import { HabitTrackerGrid } from '../components/habits/HabitTrackerGrid';
import { HabitAnalytics } from '../components/habits/HabitAnalytics';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { Loader2 } from 'lucide-react';

export function Habits() {
  const { fetchData, loading } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | undefined>();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 250px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.75rem', fontWeight: 'bold' }}>
            <Target size={28} className="text-accent" />
            Seguimiento de Hábitos
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Construye consistencia y alcanza tus metas diarias.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenNewModal} style={{ flexShrink: 0 }}>
          <Plus size={18} style={{ marginRight: '6px' }} />
          Nuevo Hábito
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin text-accent" />
        </div>
      ) : (
        <>
          <HabitTrackerGrid onEditHabit={handleEditHabit} />
          <HabitAnalytics />
        </>
      )}

      <HabitFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        habitIdToEdit={editingHabitId}
      />
    </div>
  );
}
