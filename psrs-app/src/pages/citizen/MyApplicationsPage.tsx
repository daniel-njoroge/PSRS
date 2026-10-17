import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import type { Application, ApplicationStatus } from '../../types';
import { Search, Filter, PlusCircle, ArrowRight, AlertTriangle, FileText } from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'All';

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const statuses = [
    'All',
    'Submitted',
    'Under Review',
    'Action Required',
    'Approved',
    'Completed',
    'Rejected',
    'Draft'
  ];

  useEffect(() => {
    async function fetchApps() {
      try {
        setLoading(true);
        const url = currentStatus === 'All'
          ? '/applications/my'
          : `/applications/my?status=${encodeURIComponent(currentStatus)}`;

        const res = await api.get<{ success: boolean; applications: Application[] }>(url);
        if (res.success) {
          setApplications(res.applications || []);
        }
      } catch (err) {
        console.error('Failed to load citizen applications:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, [currentStatus]);

  const handleStatusFilter = (st: string) => {
    const params = new URLSearchParams(searchParams);
    if (st === 'All') params.delete('status');
    else params.set('status', st);
    setSearchParams(params);
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      app.reference_number.toLowerCase().includes(term) ||
      (app.service_name && app.service_name.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/citizen/dashboard">Citizen Dashboard</Link>
          <span>/</span>
          <span>My Applications</span>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              My Lodged Applications
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Track the statutory progress of your active and past public service requests.
            </p>
          </div>

          <Link to="/services" className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>Apply for New Service</span>
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '38px', height: '38px' }}
                  placeholder="Filter by Ref # or Service name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {statuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusFilter(st)}
                    className={`btn btn-sm ${currentStatus === st ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '12px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Applications Master Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading applications register...
              </div>
            ) : filteredApps.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <FileText size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No Applications Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', maxWidth: '380px', margin: '4px auto 16px auto' }}>
                  {currentStatus !== 'All'
                    ? `You currently have no applications under status "${currentStatus}".`
                    : 'You have not submitted any public service requests yet.'}
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
                      <th>Reference Number</th>
                      <th>Service Details</th>
                      <th>Status</th>
                      <th>Statutory Fee</th>
                      <th>Lodged Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <Link
                            to={`/citizen/applications/${app.id}`}
                            className="ref-number"
                            style={{ textDecoration: 'none' }}
                          >
                            {app.reference_number}
                          </Link>
                          {app.action_required_note && (
                            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                              <AlertTriangle size={11} />
                              <span>Action Required</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                            {app.service_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {app.service_department}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={app.status} size="sm" />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>
                            {app.fee_kes === 0 ? 'Complimentary' : `KES ${app.fee_kes?.toLocaleString()}`}
                          </div>
                          <div style={{ fontSize: '11px', color: app.payment_status === 'Completed' ? '#006644' : '#94a3b8' }}>
                            {app.fee_kes === 0 ? 'No Fee' : app.payment_status === 'Completed' ? '✓ Remitted' : 'Unpaid'}
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {new Date(app.created_at).toLocaleDateString('en-KE')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/citizen/applications/${app.id}`}
                            className={`btn btn-sm ${app.status === 'Action Required' ? 'btn-danger' : 'btn-outline'}`}
                          >
                            {app.status === 'Action Required' ? 'Resolve Action' : 'View Dossier'}
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
      </div>
    </div>
  );
};
