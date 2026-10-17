import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { StatusBadge } from '../../components/StatusBadge';
import type { CitizenRequest } from '../../types';

export const CitizenRequestsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<{ success: boolean; requests: CitizenRequest[] }>('/requests/my')
      .then((response) => setRequests(response.requests))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load your requests.'))
      .finally(() => setLoading(false));
  }, []);
  const openCount = requests.filter((request) => request.status !== 'Resolved').length;
  const resolvedCount = requests.length - openCount;

  return (
    <div className="gov-container page-container" style={{ padding: '36px 0 60px' }}>
      <h1 style={{ color: 'var(--gov-navy-900)', fontSize: 28, fontWeight: 800 }}>Welcome, {user?.full_name.split(' ')[0]}</h1>
      <p style={{ color: '#64748b' }}>Request local services and follow their progress here.</p>
      <div className="summary-grid" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '24px 0' }}>
        <div className="gov-card summary-card" style={{ padding: 20, minWidth: 170 }}><div style={{ color: '#64748b' }}>Open requests</div><strong style={{ fontSize: 28 }}>{openCount}</strong></div>
        <div className="gov-card summary-card" style={{ padding: 20, minWidth: 170 }}><div style={{ color: '#64748b' }}>Resolved</div><strong style={{ fontSize: 28 }}>{resolvedCount}</strong></div>
        <Link to="/citizen/requests/new" className="btn btn-primary" style={{ alignSelf: 'center' }}>Submit a request</Link>
      </div>
      {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
      <h2 style={{ color: 'var(--gov-navy-900)', fontSize: 20, margin: '28px 0 14px' }}>My service requests</h2>
      {loading ? <p role="status">Loading your requests…</p> : requests.length === 0 ? (
        <div className="gov-card" style={{ padding: 32, textAlign: 'center' }}>
          <h3>No requests yet</h3>
          <p style={{ color: '#64748b' }}>Your submitted local service requests will appear here.</p>
          <Link to="/requests" className="btn btn-primary" style={{ marginTop: 12 }}>Browse services</Link>
        </div>
      ) : (
        <div className="gov-card">
          <div className="gov-table-wrapper"><table className="gov-table">
            <thead><tr><th>Reference</th><th>Category</th><th>Location</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
            <tbody>{requests.map((request) => <tr key={request.id}>
              <td><Link to={`/citizen/requests/${request.id}`}>{request.reference_number}</Link></td>
              <td>{request.category}</td>
              <td>{request.location}</td>
              <td><StatusBadge status={request.status} /></td>
              <td>{new Date(request.created_at).toLocaleDateString()}</td>
              <td><Link to={`/citizen/requests/${request.id}`}>View</Link></td>
            </tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
};
