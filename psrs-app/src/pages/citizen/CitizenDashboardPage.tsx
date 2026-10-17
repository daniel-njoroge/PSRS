import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import type { Application, Announcement } from '../../types';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  CreditCard,
  Search,
  Bell,
  ChevronRight
} from 'lucide-react';

interface CitizenDashboardSummary {
  totalApplications: number;
  activeApplications: number;
  actionRequiredCount: number;
  completedCount: number;
  unreadNotifications: number;
  recentApplications: Application[];
}

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CitizenDashboardSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashRes, annRes] = await Promise.all([
          api.get<{ success: boolean; summary: CitizenDashboardSummary }>('/stats/citizen'),
          api.get<{ success: boolean; announcements: Announcement[] }>('/notifications/announcements'),
        ]);

        if (dashRes.success && dashRes.summary) {
          setSummary(dashRes.summary);
        }
        if (annRes.success && annRes.announcements) {
          setAnnouncements(annRes.announcements);
        }
      } catch (err) {
        console.error('Failed to load citizen dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Welcome Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#006644', fontWeight: 700, textTransform: 'uppercase' }}>
              Republic of Kenya • Citizen Portal
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Citizen Dashboard — {user?.full_name}
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              National ID: <strong>{user?.national_id}</strong> • Domicile: <strong>{user?.county} County ({user?.sub_county})</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/services" className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Apply for New Service</span>
            </Link>
            <Link to="/track" className="btn btn-outline btn-sm">
              <Search size={15} />
              <span>Track Reference</span>
            </Link>
          </div>
        </div>

        {/* Action Required Banner if any */}
        {summary && summary.actionRequiredCount > 0 && (
          <div className="gov-alert gov-alert-danger" style={{ marginBottom: '24px', alignItems: 'center' }}>
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '15px' }}>Urgent Attention Required:</strong>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>
                You have {summary.actionRequiredCount} application(s) awaiting citizen clarification or document re-upload. Review officer remarks to prevent request rejection.
              </div>
            </div>
            <Link to="/citizen/applications?status=Action+Required" className="btn btn-danger btn-sm">
              Resolve Issues Now
            </Link>
          </div>
        )}

        {/* 4 Metric Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="gov-card">
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Applications</span>
                <FileText size={18} color="#0a2540" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                {summary ? summary.totalApplications : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Lifetime lodged service requests
              </div>
            </div>
          </div>

          <div className="gov-card" style={{ borderLeft: '3px solid #d97706' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>Active In Review</span>
                <Clock size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#92400e' }}>
                {summary ? summary.activeApplications : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Under active officer adjudication
              </div>
            </div>
          </div>

          <div className="gov-card" style={{ borderLeft: summary && summary.actionRequiredCount > 0 ? '3px solid #dc2626' : '3px solid var(--gov-slate-300)' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: summary && summary.actionRequiredCount > 0 ? '#991b1b' : '#64748b' }}>
                  Action Required
                </span>
                <AlertTriangle size={18} color={summary && summary.actionRequiredCount > 0 ? '#dc2626' : '#94a3b8'} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: summary && summary.actionRequiredCount > 0 ? '#dc2626' : 'var(--gov-slate-700)' }}>
                {summary ? summary.actionRequiredCount : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Corrections or documents needed
              </div>
            </div>
          </div>

          <div className="gov-card" style={{ borderLeft: '3px solid #006644' }}>
            <div className="gov-card-body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#006644' }}>Approved & Completed</span>
                <CheckCircle2 size={18} color="#006644" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#006644' }}>
                {summary ? summary.completedCount : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Finalized official permits / certificates
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left: Recent Applications Table */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Recent Service Applications</div>
              <Link to="/citizen/applications" style={{ fontSize: '13px', color: '#006644', fontWeight: 600, textDecoration: 'none' }}>
                View All Applications →
              </Link>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Loading applications...
                </div>
              ) : !summary || summary.recentApplications.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                    You have not lodged any public service applications yet.
                  </p>
                  <Link to="/services" className="btn btn-primary btn-sm">
                    Browse Services Directory
                  </Link>
                </div>
              ) : (
                <div className="gov-table-wrapper" style={{ border: 'none' }}>
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Reference No.</th>
                        <th>Service Requested</th>
                        <th>Status</th>
                        <th>Fee / Payment</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentApplications.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <Link
                              to={`/citizen/applications/${app.id}`}
                              className="ref-number"
                              style={{ textDecoration: 'none' }}
                            >
                              {app.reference_number}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(app.created_at).toLocaleDateString('en-KE')}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--gov-navy-900)' }}>
                              {app.service_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {app.service_category}
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: app.payment_status === 'Completed' ? '#006644' : '#64748b' }}>
                              {app.fee_kes === 0
                                ? 'Free'
                                : app.payment_status === 'Completed'
                                ? '✓ Paid'
                                : 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/citizen/applications/${app.id}`} className="btn btn-outline btn-sm">
                              Dossier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Tools & Official Notices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Actions Panel */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Quick Actions</div>
              </div>
              <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/services" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <PlusCircle size={16} color="#006644" />
                  <span>Explore 10+ Public Services</span>
                </Link>
                <Link to="/citizen/payments" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <CreditCard size={16} color="#006644" />
                  <span>View Receipts & Statements</span>
                </Link>
                <Link to="/track" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <Search size={16} color="#006644" />
                  <span>Track Milestone History</span>
                </Link>
              </div>
            </div>

            {/* Official Announcements */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} color="#006644" />
                  <span>Public Gazette Advisories</span>
                </div>
              </div>
              <div className="gov-card-body" style={{ padding: '16px' }}>
                {announcements.slice(0, 2).map((a) => (
                  <div key={a.id} style={{ borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-900)' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{a.summary}</div>
                  </div>
                ))}
                <Link to="/help" style={{ fontSize: '12px', color: '#006644', fontWeight: 600 }}>
                  View All Announcements →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
