import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  CreditCard,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  FileCheck
} from 'lucide-react';

interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  actionRequired: number;
  approved: number;
  completed: number;
  rejected: number;
  statusCounts: Record<string, number>;
  revenueKes: number;
  transactionsCount: number;
  citizensCount: number;
  staffCount: number;
  categoryBreakdown: Array<{ category: string; application_count: number; revenue_kes: number }>;
  countyBreakdown: Array<{ county: string; count: number }>;
  recentActivity: Array<{
    id: string;
    user_name: string;
    user_email: string;
    user_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    timestamp: string;
  }>;
}

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; stats: AdminStats }>('/stats/admin');
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span>{isAdmin ? 'System Administration' : 'Officer Workbench'}</span>
          <span>/</span>
          <span>Dashboard Overview</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#006644', fontWeight: 700, textTransform: 'uppercase' }}>
              Republic of Kenya • Public Sector Administration
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              {isAdmin ? 'System Administrator Console' : `Processing Officer Console — ${user?.department || 'Registry'}`}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Operational application volume, revenue clearance, SLA compliance, and audit trail.
            </p>
          </div>

          {/* Quick Nav Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/admin/applications" className="btn btn-primary btn-sm">
              <FileText size={15} />
              <span>Review Applications</span>
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/services" className="btn btn-outline btn-sm">
                  <Layers size={15} />
                  <span>Manage Catalog</span>
                </Link>
                <Link to="/admin/users" className="btn btn-outline btn-sm">
                  <Users size={15} />
                  <span>Citizen Accounts</span>
                </Link>
                <Link to="/admin/payments" className="btn btn-outline btn-sm">
                  <CreditCard size={15} />
                  <span>Revenue Reports</span>
                </Link>
                <Link to="/admin/audit" className="btn btn-outline btn-sm">
                  <Shield size={15} />
                  <span>Audit Logs</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          {/* Total Applications */}
          <div className="gov-card">
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Lodged</span>
                <FileText size={18} color="#0a2540" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                {stats?.totalApplications || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Across all departments
              </div>
            </div>
          </div>

          {/* Pending Review */}
          <div className="gov-card" style={{ borderLeft: '3px solid #d97706' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>Pending Adjudication</span>
                <Clock size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#92400e' }}>
                {stats?.pendingReview || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Awaiting officer review
              </div>
            </div>
          </div>

          {/* Action Required */}
          <div className="gov-card" style={{ borderLeft: '3px solid #dc2626' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Citizen Correction</span>
                <AlertTriangle size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>
                {stats?.actionRequired || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Document re-upload requested
              </div>
            </div>
          </div>

          {/* Revenue Remitted */}
          <div className="gov-card" style={{ borderLeft: '3px solid #006644' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#006644' }}>Revenue Cleared</span>
                <CreditCard size={18} color="#006644" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#006644' }}>
                KES {stats ? stats.revenueKes.toLocaleString() : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stats?.transactionsCount || 0} verified receipts
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Category Volumes & Geographic Spread */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '28px' }}>
          {/* Department / Category Breakdown */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Application Volume & Revenue by Category</div>
              <Link to="/admin/applications" style={{ fontSize: '12px', color: '#006644', fontWeight: 600 }}>
                View Table →
              </Link>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Service Sector</th>
                      <th>Requests</th>
                      <th style={{ textAlign: 'right' }}>Revenue (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.categoryBreakdown?.map((cat) => (
                      <tr key={cat.category}>
                        <td style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>{cat.category}</td>
                        <td>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '3px', fontWeight: 600, fontSize: '12px' }}>
                            {cat.application_count}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#006644' }}>
                          KES {cat.revenue_kes.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* County Geographic Distribution */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Geographic Volume (Kenyan Counties)</div>
            </div>
            <div className="gov-card-body" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats?.countyBreakdown?.map((c) => {
                  const maxCount = Math.max(...(stats?.countyBreakdown?.map(x => x.count) || [1]));
                  const pct = Math.round((c.count / maxCount) * 100);
                  return (
                    <div key={c.county}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gov-navy-900)' }}>{c.county} County</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{c.count} requests</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#006644', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Administrative Audit Trail Feed */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#006644" />
              <span>Recent Institutional Audit Trail</span>
            </div>
            {isAdmin && (
              <Link to="/admin/audit" style={{ fontSize: '12px', color: '#006644', fontWeight: 600 }}>
                Full Audit Register →
              </Link>
            )}
          </div>
          <div className="gov-card-body" style={{ padding: 0 }}>
            <div className="gov-table-wrapper" style={{ border: 'none' }}>
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Official User</th>
                    <th>Action</th>
                    <th>Target Record</th>
                    <th>Context Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentActivity?.map((act) => (
                    <tr key={act.id}>
                      <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(act.timestamp).toLocaleString('en-KE')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--gov-navy-900)' }}>
                          {act.user_name || act.user_email || 'System'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                          {act.user_role || 'System'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 7px', borderRadius: '3px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {act.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                        {act.details?.referenceNumber || act.entity_id || 'N/A'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>
                        {act.details?.remarks || act.details?.name || act.details?.role || JSON.stringify(act.details).slice(0, 50)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
