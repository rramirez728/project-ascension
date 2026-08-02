import { PageHeader } from '../components/layout/PageHeader.jsx';
import { DashboardGrid } from '../components/features/dashboard/DashboardGrid.jsx';
import { useDashboardStats } from '../hooks/useDashboardStats.js';

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your fitness overview at a glance"
      />
      <DashboardGrid stats={stats} loading={loading} />
    </div>
  );
}
