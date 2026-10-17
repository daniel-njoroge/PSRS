import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AdminRequestsPage } from './AdminRequestsPage';

interface RequestStats {
  total: number;
  open: number;
  resolved: number;
}

export const RequestAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<{ success: boolean; stats: RequestStats }>('/requests/stats')
      .then((response) => setStats(response.stats))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load analytics.'));
  }, []);

  return (
    <div className="gov-container page-container" style={{ padding: '36px 0 60px' }}>
      <div className="page-heading-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div><h1 style={{ color: 'var(--gov-navy-900)', fontSize: 28, fontWeight: 800 }}>Admin dashboard</h1><p style={{ color: '#64748b' }}>Monitor incoming issues and manage citizen service requests.</p></div>
      </div>
      {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
      <div className="summary-grid category-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, margin: '24px 0' }}>
        {[['Total requests', stats?.total ?? '—'], ['Open', stats?.open ?? '—'], ['Resolved', stats?.resolved ?? '—']].map(([label, count]) => (
          <div className="gov-card summary-card" key={label} style={{ padding: 22 }}><div style={{ color: '#64748b' }}>{label}</div><strong style={{ display: 'block', fontSize: 32, color: 'var(--gov-navy-900)', marginTop: 4 }}>{count}</strong></div>
        ))}
      </div>
      <AdminRequestsPage />
    </div>
  );
};
