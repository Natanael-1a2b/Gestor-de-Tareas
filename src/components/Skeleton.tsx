export function SkeletonCard() {
  return (
    <div className="card kanban-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-line--sm" />
      <div className="skeleton-line skeleton-line--lg" />
      <div className="skeleton-line skeleton-line--md" />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <div className="skeleton-line skeleton-line--xs" />
        <div className="skeleton-line skeleton-line--xs" />
      </div>
    </div>
  );
}

export function SkeletonColumn() {
  return (
    <div className="kanban-column" aria-hidden="true">
      <div className="kanban-column-header">
        <div className="skeleton-line skeleton-line--sm" style={{ width: '60%' }} />
        <div className="skeleton-circle" />
      </div>
      <div className="kanban-column-body">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
