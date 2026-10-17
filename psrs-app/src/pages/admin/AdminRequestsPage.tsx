import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { REQUEST_CATEGORIES, type CitizenRequest, type RequestStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

const STATUSES: Array<RequestStatus | 'All'> = ['All', 'Pending', 'In Progress', 'Resolved'];

function buildQuery(status: string, category: string, search: string) {
  const query = new URLSearchParams();
  if (status !== 'All') query.set('status', status);
  if (category !== 'All') query.set('category', category);
  if (search.trim()) query.set('search', search.trim());
  return query.toString();
}

export const AdminRequestsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const status = params.get('status') || 'All';
  const category = params.get('category') || 'All';

  const load = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError('');
      const query = buildQuery(status, category, searchTerm);
      const response = await api.get<{ success: boolean; requests: CitizenRequest[] }>(`/requests?${query}`);
      setRequests(response.requests);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    const query = buildQuery(status, category, '');
    api.get<{ success: boolean; requests: CitizenRequest[] }>(`/requests?${query}`)
      .then((response) => {
        if (active) {
          setRequests(response.requests);
          setError('');
        }
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load requests.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, category]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'All') next.delete(key);
    else next.set(key, value);
    setParams(next);
  };
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); void load(search); };

  return (
    <section className="admin-request-inbox" aria-labelledby="admin-request-inbox-title">
      <div className="admin-inbox-heading">
        <div>
          <h2 id="admin-request-inbox-title">Request inbox</h2>
          <p>Review citizen reports and update them as work progresses.</p>
        </div>
        <span className="admin-inbox-count">{loading ? 'Loading…' : `${requests.length} requests`}</span>
      </div>
      <div className="gov-card" style={{ marginBottom: 18 }}><div className="gov-card-body filter-controls" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <form className="search-form" onSubmit={submitSearch} style={{ display: 'flex', gap: 8, flex: '1 1 300px' }}><input className="form-control" aria-label="Search requests" placeholder="Search reference, citizen, location, or description" value={search} onChange={(event) => setSearch(event.target.value)} /><button className="btn btn-primary">Search</button></form>
        <select className="form-control" aria-label="Filter by status" value={status} onChange={(event) => setFilter('status', event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="form-control" aria-label="Filter by category" value={category} onChange={(event) => setFilter('category', event.target.value)}><option>All</option>{REQUEST_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
      </div></div>
      {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
      <div className="gov-card"><div className="gov-table-wrapper"><table className="gov-table">
        <thead><tr><th>Reference</th><th>Citizen</th><th>Category</th><th>Location</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>{!loading && requests.map((request) => <tr
          key={request.id}
          className="request-row"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a')) return;
            navigate(`/admin/requests/${request.id}`);
          }}
          title={`Open request ${request.reference_number}`}
        >
          <td><Link to={`/admin/requests/${request.id}`}>{request.reference_number}</Link></td><td>{request.citizen_name}</td><td>{request.category}</td><td>{request.location}</td><td><StatusBadge status={request.status} /></td><td>{new Date(request.created_at).toLocaleDateString()}</td>
        </tr>)}
        {!loading && requests.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No requests match these filters.</td></tr>}
        {loading && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading requests…</td></tr>}
        </tbody>
      </table></div></div>
    </section>
  );
};
