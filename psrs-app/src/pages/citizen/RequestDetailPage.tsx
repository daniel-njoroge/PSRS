import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getAssetUrl } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { StatusBadge } from '../../components/StatusBadge';
import type { CitizenRequest, RequestStatus } from '../../types';

export const RequestDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [request, setRequest] = useState<CitizenRequest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRequest = useCallback(
    () => api.get<{ success: boolean; request: CitizenRequest }>(`/requests/${id}`),
    [id]
  );
  useEffect(() => {
    let active = true;
    fetchRequest()
      .then((response) => { if (active) setRequest(response.request); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this request.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchRequest]);

  const moveToNextStatus = async () => {
    if (!request) return;
    const nextStatus: RequestStatus | null = request.status === 'Pending' ? 'In Progress' : request.status === 'In Progress' ? 'Resolved' : null;
    if (!nextStatus) return;
    try {
      setSaving(true);
      await api.patch(`/requests/${request.id}/status`, { status: nextStatus, note: note.trim() || undefined });
      setNote('');
      const response = await fetchRequest();
      setRequest(response.request);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update request status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="gov-container page-container" style={{ padding: 50 }}>Loading request…</div>;
  if (error && !request) return <div className="gov-container page-container" style={{ padding: 50 }}><div className="gov-alert gov-alert-danger">{error}</div><button className="btn btn-outline" onClick={() => navigate(-1)}>Go back</button></div>;
  if (!request) return null;

  return (
    <div className="gov-container page-container" style={{ maxWidth: 900, padding: '36px 0 60px' }}>
      <div className="breadcrumbs"><Link to={isAdmin ? '/admin/requests' : '/citizen/dashboard'}>{isAdmin ? 'All requests' : 'My requests'}</Link><span>/</span><span>Request details</span></div>
      <div className="gov-card">
        <div className="gov-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <div><div style={{ color: '#64748b', fontSize: 12 }}>REQUEST REFERENCE</div><h1 className="request-reference" style={{ fontSize: 22, margin: 0 }}>{request.reference_number}</h1></div>
          <StatusBadge status={request.status} />
        </div>
        <div className="gov-card-body request-card-body" style={{ padding: 24 }}>
          {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {isAdmin && <div><dt>Submitted by</dt><dd>{request.citizen_name}</dd></div>}
            <div><dt>Category</dt><dd>{request.category}</dd></div>
            <div><dt>Location</dt><dd>{request.location}</dd></div>
            <div><dt>Submitted</dt><dd>{new Date(request.created_at).toLocaleString()}</dd></div>
            <div><dt>Last updated</dt><dd>{new Date(request.updated_at).toLocaleString()}</dd></div>
          </dl>
          <section style={{ marginTop: 18 }}><h2 style={{ fontSize: 17 }}>Description</h2><p style={{ whiteSpace: 'pre-wrap' }}>{request.description}</p></section>
          {request.image_path && <figure style={{ margin: '20px 0' }}><img src={getAssetUrl(request.image_path)} alt={`Image attached to request ${request.reference_number}`} style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 6 }} /></figure>}

          {isAdmin && request.status !== 'Resolved' && (
            <section style={{ borderTop: '1px solid #e2e8f0', marginTop: 24, paddingTop: 20 }}>
              <h2 style={{ fontSize: 17 }}>Update status</h2>
              <p style={{ color: '#64748b', fontSize: 13 }}>Move this request to {request.status === 'Pending' ? 'In Progress' : 'Resolved'}.</p>
              <label style={{ display: 'block', marginBottom: 12 }}><span className="form-label">Update note (optional)</span><textarea className="form-control" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} /></label>
              <button type="button" className="btn btn-primary" onClick={moveToNextStatus} disabled={saving}>{saving ? 'Updating…' : `Mark ${request.status === 'Pending' ? 'In Progress' : 'Resolved'}`}</button>
            </section>
          )}
          <section style={{ borderTop: '1px solid #e2e8f0', marginTop: 24, paddingTop: 20 }}>
            <h2 style={{ fontSize: 17 }}>Status history</h2>
            <ol style={{ paddingLeft: 22 }}>{request.history?.map((entry, index) => <li key={`${entry.created_at}-${index}`} style={{ margin: '12px 0' }}>
              <StatusBadge status={entry.status} size="sm" /> <span style={{ color: '#64748b', fontSize: 13 }}>{new Date(entry.created_at).toLocaleString()}</span>
              {entry.note && <div>{entry.note}</div>}
            </li>)}</ol>
          </section>
        </div>
      </div>
    </div>
  );
};
