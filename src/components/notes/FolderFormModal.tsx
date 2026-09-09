import { useState, useEffect } from 'react';
import { Save, Palette } from 'lucide-react';
import { useNoteFolderStore } from '../../store/useNoteFolderStore';
import type { NoteFolder } from '../../types/noteFolder';
import { FOLDER_COLORS } from '../../utils/colors';
import '../habits/HabitFormModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: NoteFolder;
}

export function FolderFormModal({ isOpen, onClose, folderToEdit }: Props) {
  const addFolder = useNoteFolderStore((s) => s.addFolder);
  const updateFolder = useNoteFolderStore((s) => s.updateFolder);

  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (folderToEdit) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(folderToEdit.name);
        setColor(folderToEdit.color);
      } else {
        setName('');
        setColor(FOLDER_COLORS[0]);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, folderToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (folderToEdit) {
        await updateFolder(folderToEdit.id, { name, color });
      } else {
        await addFolder({ name, color });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{folderToEdit ? 'Editar Carpeta' : 'Nueva Carpeta'}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="folder-name">Nombre</label>
            <input
              id="folder-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Trabajo, Ideas, Personal..."
              maxLength={60}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label>Color</label>
            <div className="input color-picker-container" style={{ padding: '0 12px' }}>
              <Palette size={16} className="color-icon" style={{ color }} />
              <div className="color-swatches">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Seleccionar color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim()}>
              <Save size={16} style={{ marginRight: '6px' }} />
              {isSubmitting ? 'Guardando...' : 'Guardar Carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
