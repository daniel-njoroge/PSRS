import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Search, CheckCircle2, Clock, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import type { ApplicationStatus } from '../../types';

interface TrackMilestone {
  status: ApplicationStatus;
  timestamp: string;
  public_note: string;
}

interface TrackRecord {
  reference_number: string;
  service_name: string;
  category: string;
  department: string;
  current_status: ApplicationStatus;
  submitted_at: string;
  last_updated: string;
  estimated_days: number;
  milestones: TrackMilestone[];
}

export const TrackRequestPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [referenceInput, setReferenceInput] = useState(initialRef);
  const [record, setRecord] = useState<TrackRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleRefs = [
    'PSRS-2026-CRB-90214',
    'PSRS-2026-IMM-18492',
    'PSRS-2026-POL-44102',
    'PSRS-2026-LND-77190',
  ];

  const executeTrack = async (ref: string) => {
    if (!ref.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setRecord(null);

      const res = await api.get<{ success: boolean; record: TrackRecord }>(`/applications/track/${encodeURIComponent(ref.trim())}`);
      if (res.success && res.record) {
        setRecord(res.record);
      } else {
        setError('No public application record found for this reference code.');
      }
    } catch (err: any) {
      setError(err.message || 'Reference number not found. Please verify the code printed on your receipt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      executeTrack(initialRef);
    }
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referenceInput.trim()) {
      setSearchParams({ ref: referenceInput.trim().toUpperCase() });
      executeTrack(referenceInput.trim().toUpperCase());
    }
  };

  const handleSelectSample = (sample: string) => {
    setReferenceInput(sample);
    setSearchParams({ ref: sample });
    executeTrack(sample);
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container" style={{ maxWidth: '860px' }}>
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Track Public Request</span>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '28px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Track Public Service Request
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Check the real-time processing status and verified milestone progress of your public application.
          </p>
        </div>

        {/* Tracking Card */}
        <div className="gov-card" style={{ marginBottom: '28px' }}>
          <div className="gov-card-body" style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px', height: '46px', fontFamily: 'var(--font-mono)', fontSize: '15px', textTransform: 'uppercase' }}
                  placeholder="Enter Reference Number (e.g. PSRS-2026-CRB-90214)"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '46px', padding: '0 24px' }} disabled={loading}>
                {loading ? 'Tracking...' : 'Track Request'}
              </button>
            </form>

            {/* Quick Sample Ref Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
              <span style={{ fontWeight: 600 }}>Test Sample References:</span>
              {sampleRefs.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#0a2540',
                    fontWeight: 600
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="gov-alert gov-alert-danger">
            <AlertCircle size={20} />
            <div>
              <strong>Tracking Verification Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
            Querying official registry database...
          </div>
        )}

        {/* Tracking Result Dossier */}
        {record && !loading && (
          <div className="gov-card">
            <div className="gov-card-header" style={{ background: '#f8fafc', padding: '16px 20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Verified Request Dossier
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)' }}>
                  {record.reference_number}
                </div>
              </div>
              <div>
                <StatusBadge status={record.current_status} />
              </div>
            </div>

            <div className="gov-card-body" style={{ padding: '24px' }}>
              {/* Service Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Service Name</div>
                  <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>{record.service_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Supervising Department</div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{record.department}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Lodged On</div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    {new Date(record.submitted_at).toLocaleString('en-KE')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Standard Processing SLA</div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    {record.estimated_days} Business Days
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '16px' }}>
                  Processing Milestones & Official Timeline
                </h3>

                <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #cbd5e1', marginLeft: '8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {record.milestones.map((m, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-31px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: idx === record.milestones.length - 1 ? '#006644' : '#64748b',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 2px rgba(0, 102, 68, 0.2)'
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <StatusBadge status={m.status} size="sm" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(m.timestamp).toLocaleString('en-KE')}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px', marginTop: '4px' }}>
                        {m.public_note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '28px', borderTop: '1px solid var(--gov-slate-200)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                  <ShieldCheck size={16} color="#006644" />
                  <span>Public audit verified. Sensitive citizen data is protected.</span>
                </div>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Citizen Sign In to View Full Application
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
