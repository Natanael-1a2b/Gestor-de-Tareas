import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

export const TRASH_ZONE_ID = 'trash-zone';

interface TrashDropButtonProps {
  onClick: () => void;
  count?: number;
  label?: string;
}

export function TrashDropButton({ onClick, count = 0, label = 'Papelera' }: TrashDropButtonProps) {
  const { setNodeRef, isOver } = useDroppable({ id: TRASH_ZONE_ID });

  return (
    <span className="trash-drop-wrapper">
      <button
        ref={setNodeRef}
        type="button"
        className={`btn btn-ghost trash-drop-btn ${isOver ? 'is-over' : ''}`}
        onClick={onClick}
        title={label}
        aria-label={`${label}${count > 0 ? ` (${count} elementos)` : ''}`}
      >
        <Trash2 size={16} />
      </button>
      {count > 0 && <span className="trash-drop-badge">{count}</span>}
    </span>
  );
}
