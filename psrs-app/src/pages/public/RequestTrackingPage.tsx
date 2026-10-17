import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import type { RequestStatus } from '../../types';

interface DemoRequest {
  reference_number: string;
  category: string;
  status: RequestStatus;
}

interface TrackedRequest {
  reference_number: string;
  category: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  history: Array<{ status: RequestStatus; created_at: string }>;
}

export const RequestTrackingPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [reference, setReference] = useState(params.get('ref') || '');
  const [record, setRecord] = useState<TrackedRequest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [demoLoading, setDemoLoading] = useState(true);
  const [demoError, setDemoError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<{ success: boolean; requests: DemoRequest[] }>('/requests/demo')
      .then((response) => {
        if (active) setDemoRequests(response.requests);
      })
      .catch((reason: unknown) => {
        if (active) setDemoError(reason instanceof Error ? reason.message : 'Could not load demo requests.');
      })
      .finally(() => {
        if (active) setDemoLoading(false);
      });
    return () => { active = false; };
  }, []);

  const track = async (value: string) => {
    const clean = value.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError('');
    setRecord(null);
    setParams({ ref: clean });
    try {
      const response = await api.get<{ success: boolean; request: TrackedRequest }>(`/requests/track/${encodeURIComponent(clean)}`);
      setRecord(response.request);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not find this request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-container page-container" style={{ maxWidth: 780, padding: '40px 0 64px' }}>
      <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Track request</span></div>
      <h1 style={{ color: 'var(--gov-navy-900)', fontSize: 28, fontWeight: 800 }}>Track a request</h1>
      <p style={{ color: '#64748b', margin: '8px 0 22px' }}>Enter the reference number shown after you submitted a request.</p>
      <form className="gov-card" onSubmit={(event) => { event.preventDefault(); void track(reference); }}>
        <div className="gov-card-body tracking-form" style={{ display: 'flex', gap: 10, padding: 20 }}>
          <input className="form-control" aria-label="Request reference number" placeholder="PSR-2026-XXXXXXXX" value={reference} onChange={(event) => setReference(event.target.value)} required />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Checking…' : 'Track'}</button>
        </div>
      </form>
      {error && <div className="gov-alert gov-alert-danger" role="alert" style={{ marginTop: 18 }}>{error}</div>}
      {record && <section className="gov-card tracked-request" aria-labelledby="tracked-request-reference">
        <header className="tracked-request-header">
          <div className="tracked-request-identity">
            <span className="tracked-request-eyebrow">Request reference</span>
            <h2 id="tracked-request-reference" className="tracked-request-reference">{record.reference_number}</h2>
            <p>{record.category}</p>
          </div>
          <div className="tracked-request-current">
            <span className="tracked-request-eyebrow">Current status</span>
            <StatusBadge status={record.status} />
          </div>
        </header>
        <div className="gov-card-body tracked-request-body">
          <dl className="tracked-request-meta">
            <div>
              <dt>Submitted</dt>
              <dd><time dateTime={record.created_at}>{new Date(record.created_at).toLocaleString()}</time></dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd><time dateTime={record.updated_at}>{new Date(record.updated_at).toLocaleString()}</time></dd>
            </div>
          </dl>
          <div className="tracked-request-history">
            <div className="tracked-request-history-heading">
              <h3>Status history</h3>
              <p>Updates recorded for this request</p>
            </div>
            <ol className="request-timeline">
              {record.history.map((event, index) => (
                <li className="request-timeline-item" key={`${event.created_at}-${index}`}>
                  <span className={`request-timeline-marker request-timeline-${event.status.toLowerCase().replace(' ', '-')}`} aria-hidden="true" />
                  <div className="request-timeline-content">
                    <div className="request-timeline-status">
                      <StatusBadge status={event.status} size="sm" />
                      {index === record.history.length - 1 && <span className="request-timeline-current">Latest update</span>}
                    </div>
                    <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>}
      <section className="demo-requests" aria-labelledby="demo-requests-title">
        <div className="demo-requests-heading">
          <div>
            <h2 id="demo-requests-title">Try a demo request</h2>
            <p>These sample requests are real records you can track. Choose one to see its status history.</p>
          </div>
        </div>
        {demoError && <div className="gov-alert gov-alert-danger" role="alert">{demoError}</div>}
        {demoRequests.length > 0 ? (
          <div className="demo-request-list">
            {demoRequests.map((demo) => (
              <article className="gov-card demo-request-card" key={demo.reference_number}>
                <div>
                  <span className="demo-request-category">{demo.category}</span>
                  <strong className="demo-request-reference">{demo.reference_number}</strong>
                </div>
                <StatusBadge status={demo.status} />
                <button type="button" className="btn btn-outline demo-track-button" onClick={() => {
                  setReference(demo.reference_number);
                  void track(demo.reference_number);
                }} disabled={loading}>
                  Track this request
                </button>
              </article>
            ))}
          </div>
        ) : demoLoading ? (
          <p className="demo-requests-empty">Loading demo requests…</p>
        ) : !demoError ? (
          <p className="demo-requests-empty">Demo request samples aren’t loaded yet. Run <code>npm run seed</code> to add them.</p>
        ) : null}
      </section>
    </div>
  );
};
