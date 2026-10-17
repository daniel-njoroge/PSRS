import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import type { Application, User } from '../../types';
import {
  Search,
  Filter,
  UserCheck,
  Shield,
  FileText,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get('status') || 'All';
  const currentCategory = searchParams.get('category') || 'All';
  const currentAssigned = searchParams.get('assigned') || 'all';

  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Staff assignment modal
  const [assignModalApp, setAssignModalApp] = useState<Application | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentStatus !== 'All') params.set('status', currentStatus);
      if (currentCategory !== 'All') params.set('category', currentCategory);
      if (currentAssigned !== 'all') params.set('assigned', currentAssigned);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get<{
        success: boolean;
        total: number;
        applications: Application[];
      }>(`/applications?${params.toString()}`);

      if (res.success) {
        setApplications(res.applications || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentStatus, currentCategory, currentAssigned]);

  // Load staff members for assignment
  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await api.get<{ success: boolean; users: User[] }>('/users?role=staff');
        if (res.success) {
          setStaffList(res.users || []);
        }
      } catch (err) {
        console.error('Failed to load staff list:', err);
      }
    }
    loadStaff();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalApp) return;

    try {
      setAssigning(true);
      const res = await api.patch<{ success: boolean; message: string }>(`/applications/${assignModalApp.id}/assign`, {
        staff_id: selectedStaffId || null,
      });

      if (res.success) {
        setAssignModalApp(null);
        await fetchApplications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign officer.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/admin/dashboard">{isAdmin ? 'Admin Console' : 'Officer Workbench'}</Link>
          <span>/</span>
          <span>Application Register</span>
        </div>

        {/* Page Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Master Application Register
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Official registry of citizen submissions, officer assignments, and statutory adjudication.
            </p>
          </div>

          <div style={{ fontSize: '13px', background: '#f1f5f9', padding: '6px 14px', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
            Total Registered: {totalCount} Applications
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
              {/* Search */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    placeholder="Search by Ref #, Applicant Name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-navy btn-sm">Search</button>
              </form>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status:</span>
                <select
                  className="form-control"
                  style={{ height: '38px' }}
                  value={currentStatus}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value === 'All') params.delete('status');
                    else params.set('status', e.target.value);
                    setSearchParams(params);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Assignment Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Staff:</span>
                <select
                  className="form-control"
                  style={{ height: '38px' }}
                  value={currentAssigned}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value === 'all') params.delete('assigned');
                    else params.set('assigned', e.target.value);
                    setSearchParams(params);
                  }}
                >
                  <option value="all">All Assignments</option>
                  <option value="me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              {/* Clear button */}
              {(currentStatus !== 'All' || currentCategory !== 'All' || currentAssigned !== 'all' || searchQuery) && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading application records...
              </div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <FileText size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No Application Records Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                  No requests matched the current department filters or search query.
                </p>
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Ref Number</th>
                      <th>Applicant Details</th>
                      <th>Requested Service</th>
                      <th>Status</th>
                      <th>Fee</th>
                      <th>Assigned Officer</th>
                      <th>Lodged Date</th>
                      <th style={{ textAlign: 'right' }}>Adjudicate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <Link
                            to={`/admin/applications/${app.id}/review`}
                            className="ref-number"
                            style={{ textDecoration: 'none' }}
                          >
                            {app.reference_number}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '13px' }}>
                            {app.applicant_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ID: <strong>{app.applicant_national_id}</strong> • {app.applicant_county}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {app.service_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {app.service_department}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={app.status} size="sm" />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>
                            {app.fee_kes === 0 ? 'Complimentary' : `KES ${app.fee_kes?.toLocaleString()}`}
                          </div>
                          <div style={{ fontSize: '10px', color: app.payment_status === 'Completed' ? '#006644' : '#94a3b8' }}>
                            {app.fee_kes === 0 ? 'No Fee' : app.payment_status === 'Completed' ? '✓ Paid' : 'Pending'}
                          </div>
                        </td>
                        <td>
                          {app.assigned_staff_name ? (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                              {app.assigned_staff_name}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setAssignModalApp(app);
                                setSelectedStaffId('');
                              }}
                              style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              + Assign Officer
                            </button>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(app.created_at).toLocaleDateString('en-KE')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/admin/applications/${app.id}/review`}
                            className="btn btn-primary btn-sm"
                          >
                            <span>Adjudicate</span>
                            <ArrowRight size={13} />
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

      {/* Assign Staff Officer Modal */}
      {assignModalApp && (
        <div className="modal-overlay" onClick={() => setAssignModalApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Assign Processing Officer
              </div>
              <button onClick={() => setAssignModalApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                  <div>Application: <strong style={{ fontFamily: 'var(--font-mono)' }}>{assignModalApp.reference_number}</strong></div>
                  <div>Service: <strong>{assignModalApp.service_name}</strong></div>
                  <div>Applicant: <strong>{assignModalApp.applicant_name}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Registered Officer</label>
                  <select
                    className="form-control"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.department || 'Officer'})
                      </option>
                    ))}
                  </select>
                  <div className="form-hint">Officer will receive notification and ownership of this request.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAssignModalApp(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={assigning}>
                  {assigning ? 'Assigning...' : 'Confirm Officer Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
