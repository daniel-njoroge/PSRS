import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { AuditLog } from '../../types';
import {
  Shield,
  Search,
  Filter,
  Clock,
  Eye,
  X
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'All') params.set('action', actionFilter);
      if (entityFilter !== 'All') params.set('entity_type', entityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get<{
        success: boolean;
        total: number;
        logs: AuditLog[];
      }>(`/notifications/audit-logs?${params.toString()}`);

      if (res.success) {
        setLogs(res.logs || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/admin/dashboard">Admin Console</Link>
          <span>/</span>
          <span>System Audit Trail</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              System Immutable Audit Trail
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Statutory security log recording every administrative operation, status change, and payment clearance.
            </p>
          </div>

          <div style={{ fontSize: '13px', background: '#f1f5f9', padding: '6px 14px', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
            Logged Events: {totalCount}
          </div>
        </div>

        {/* Filter bar */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    placeholder="Search by User Email, Action, or Record ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-navy btn-sm">Search</button>
              </form>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Entity:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '130px' }}
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                  >
                    <option value="All">All Entities</option>
                    <option value="application">Application</option>
                    <option value="payment">Payment</option>
                    <option value="service">Service</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Action:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '160px' }}
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="All">All Actions</option>
                    <option value="USER_LOGIN">USER_LOGIN</option>
                    <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
                    <option value="STATUS_UPDATED">STATUS_UPDATED</option>
                    <option value="STAFF_ASSIGNED">STAFF_ASSIGNED</option>
                    <option value="PAYMENT_COMPLETED">PAYMENT_COMPLETED</option>
                    <option value="SERVICE_CREATED">SERVICE_CREATED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading audit register...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Shield size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No Audit Logs Found
                </h3>
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor / Email</th>
                      <th>Action Code</th>
                      <th>Target Entity</th>
                      <th>Entity Ref</th>
                      <th>IP Address</th>
                      <th style={{ textAlign: 'right' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('en-KE')}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gov-navy-900)', fontSize: '13px' }}>
                            {log.user_name || log.user_email || 'System'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.user_role ? log.user_role.toUpperCase() : 'SYSTEM'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 7px', borderRadius: '3px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {log.entity_type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {log.details?.referenceNumber || log.entity_id || 'N/A'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b' }}>
                          {log.ip_address}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye size={13} />
                            <span>Payload</span>
                          </button>
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

      {/* Audit Detail Payload Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Audit Event Record Details
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                <div>Action: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedLog.action}</strong></div>
                <div>User: <strong>{selectedLog.user_name || selectedLog.user_email || 'System'}</strong></div>
                <div>IP Address: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedLog.ip_address}</strong></div>
                <div>Timestamp: <strong>{new Date(selectedLog.timestamp).toISOString()}</strong></div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Cryptographic Context JSON Payload
              </div>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  maxHeight: '260px'
                }}
              >
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
