import './DashboardSkeleton.css';

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-header-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-actions"></div>
      </div>

      <div className="dashboard-metrics-skeleton">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-card metric-card-skeleton"></div>
        ))}
      </div>

      <div className="dashboard-grid-skeleton">
        <div className="skeleton-card chart-card-skeleton span-4"></div>
        <div className="skeleton-card chart-card-skeleton span-4"></div>
        <div className="skeleton-card chart-card-skeleton span-4"></div>
        <div className="skeleton-card wide-card-skeleton span-12"></div>
      </div>
    </div>
  );
}
