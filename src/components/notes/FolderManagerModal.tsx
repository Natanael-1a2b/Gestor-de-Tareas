import { useState } from 'react';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useNoteFolderStore } from '../../store/useNoteFolderStore';
import type { NoteFolder } from '../../types/noteFolder';
import { ConfirmDialog } from '../ConfirmDialog';
import { FolderFormModal } from './FolderFormModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FolderManagerModal({ isOpen, onClose }: Props) {
  const folders = useNoteFolderStore((s) => s.folders);
  const deleteFolder = useNoteFolderStore((s) => s.deleteFolder);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<NoteFolder | undefined>();
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | undefined>();

  if (!isOpen) return null;

  const handleOpenNewFolder = () => {
    setFolderToEdit(undefined);
    setIsFormOpen(true);
  };

  const handleEditFolder = (folder: NoteFolder) => {
    setFolderToEdit(folder);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;
    await deleteFolder(folderToDelete.id);
    setFolderToDelete(undefined);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Carpetas</h2>
            <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {folders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Aún no tienes carpetas.
              </p>
            ) : (
              <div className="folder-manager-list">
                {folders.map((folder) => (
                  <div key={folder.id} className="folder-manager-row">
                    <span className="folder-manager-dot" style={{ backgroundColor: folder.color }} />
                    <span className="folder-manager-name">{folder.name}</span>
                    <button
                      className="btn btn-ghost"
                      aria-label={`Editar carpeta ${folder.name}`}
                      onClick={() => handleEditFolder(folder)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn btn-ghost note-delete-btn"
                      aria-label={`Eliminar carpeta ${folder.name}`}
                      onClick={() => setFolderToDelete(folder)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleOpenNewFolder}>
                <FolderPlus size={16} style={{ marginRight: '6px' }} />
                Nueva carpeta
              </button>
            </div>
          </div>
        </div>
      </div>

      <FolderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        folderToEdit={folderToEdit}
      />

      <ConfirmDialog
        isOpen={!!folderToDelete}
        title="Eliminar carpeta"
        message={`¿Seguro que deseas eliminar "${folderToDelete?.name}"? Las notas dentro no se eliminarán, solo quedarán sin carpeta.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFolderToDelete(undefined)}
      />
    </>
  );
}
