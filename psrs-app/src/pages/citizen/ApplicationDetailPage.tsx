import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getAssetUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { ReceiptModal } from '../../components/ReceiptModal';
import type { Application, Payment } from '../../types';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  CreditCard,
  Upload,
  ArrowLeft,
  ShieldCheck,
  Printer,
  XCircle
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action Required Resolution State
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const [resolving, setResolving] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; application: Application }>(`/applications/${id}`);
      if (res.success && res.application) {
        setApplication(res.application);
      } else {
        setError('Application dossier not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleResolveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationNotes.trim() && resolutionFiles.length === 0) {
      alert('Please enter clarification notes or upload the requested replacement document.');
      return;
    }

    try {
      setResolving(true);
      const form = new FormData();
      form.append('clarification_notes', clarificationNotes);
      resolutionFiles.forEach((file, idx) => {
        form.append(`rectified_doc_${idx + 1}`, file);
      });

      const res = await api.post<{ success: boolean; message: string }>(`/applications/${id}/resolve-action`, form);
      if (res.success) {
        setResolveSuccess('Requested clarification and documents submitted. Application returned to Under Review.');
        setClarificationNotes('');
        setResolutionFiles([]);
        await fetchDossier();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit clarification.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Loading verified application dossier...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="gov-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="gov-alert gov-alert-danger" style={{ maxWidth: '500px', margin: '0 auto 20px auto' }}>
          <AlertTriangle size={20} />
          <div>{error || 'Application record not accessible.'}</div>
        </div>
        <Link to="/citizen/applications" className="btn btn-outline">
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container" style={{ maxWidth: '940px' }}>
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/citizen/dashboard">Dashboard</Link>
          <span>/</span>
          <Link to="/citizen/applications">Applications</Link>
          <span>/</span>
          <span>{application.reference_number}</span>
        </div>

        {/* Dossier Header Banner */}
        <div className="gov-card" style={{ marginBottom: '24px', borderTop: '4px solid #0a2540' }}>
          <div className="gov-card-body" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Republic of Kenya • Official Dossier
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)', marginTop: '2px' }}>
                  {application.reference_number}
                </h1>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                  {application.service_name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Department: <strong>{application.service_department}</strong> • Lodged on {new Date(application.created_at).toLocaleString('en-KE')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={application.status} size="md" />
                {application.assigned_staff_name && (
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Officer: <strong>{application.assigned_staff_name}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Required Correction Panel */}
        {application.status === 'Action Required' && (
          <div className="gov-card" style={{ marginBottom: '24px', border: '2px solid #dc2626' }}>
            <div className="gov-card-header" style={{ backgroundColor: '#fff1f2', borderBottomColor: '#fecdd3' }}>
              <div className="gov-card-title" style={{ color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span>Officer Correction Notice — Action Required</span>
              </div>
            </div>
            <div className="gov-card-body" style={{ padding: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #fecdd3', padding: '14px', borderRadius: '4px', color: '#991b1b', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                <strong>Officer Remarks:</strong> {application.action_required_note || 'Clarification or replacement documentation requested.'}
              </div>

              {resolveSuccess && (
                <div className="gov-alert gov-alert-success" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={18} />
                  <div>{resolveSuccess}</div>
                </div>
              )}

              <form onSubmit={handleResolveAction}>
                <div className="form-group">
                  <label className="form-label">
                    Citizen Response / Clarification Statement <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    required
                    placeholder="Explain how you addressed the officer's remarks..."
                    value={clarificationNotes}
                    onChange={(e) => setClarificationNotes(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Upload Rectified Document Scan(s)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files) {
                        setResolutionFiles(Array.from(e.target.files));
                      }
                    }}
                    style={{ fontSize: '13px' }}
                  />
                  <div className="form-hint">Attach new, clearer scans matching the officer's request.</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={resolving}
                >
                  <Upload size={16} />
                  <span>{resolving ? 'Submitting Corrections...' : 'Submit Rectification to Officer'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Approval / Completion Seal Banner */}
        {application.status === 'Approved' || application.status === 'Completed' ? (
          <div className="gov-alert gov-alert-success" style={{ marginBottom: '24px' }}>
            <CheckCircle2 size={24} color="#006644" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>
                Application Approved & Certified
              </div>
              <div style={{ fontSize: '13px', marginTop: '2px', lineHeight: 1.5 }}>
                {application.approval_remarks || 'Official certification granted. Your request satisfies all statutory conditions under the Laws of Kenya.'}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="btn btn-primary btn-sm"
            >
              <Printer size={15} />
              <span>Print Dossier</span>
            </button>
          </div>
        ) : null}

        {/* Rejection Notice Banner */}
        {application.status === 'Rejected' && (
          <div className="gov-alert gov-alert-danger" style={{ marginBottom: '24px' }}>
            <XCircle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>
                Application Disqualified / Rejected
              </div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>
                Reason: {application.rejection_reason || 'Application did not satisfy statutory criteria.'}
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Dossier Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
          {/* Left Column: Form Details & Uploaded Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Submitted Form Data */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Submitted Application Data</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(application.form_data || {}).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--gov-slate-200)',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ color: '#64748b', fontWeight: 500 }}>
                        {key.replace(/_/g, ' ').toUpperCase()}:
                      </span>
                      <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                        {String(val)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Supporting Documents ({application.documents?.length || 0})</div>
              </div>
              <div className="gov-card-body" style={{ padding: '16px' }}>
                {!application.documents || application.documents.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                    No supporting documents attached to this record.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {application.documents.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          border: '1px solid var(--gov-slate-200)',
                          borderRadius: '4px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: '#f8fafc'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-900)' }}>
                            {doc.document_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {doc.original_filename} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
                          </div>
                        </div>

                        <a
                          href={getAssetUrl(doc.file_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={13} />
                          <span>View Doc</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Status & Audit Status History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Payment Record Card */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Statutory Payment Ledger</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Fee Amount:</span>
                  <strong style={{ fontSize: '18px', color: application.fee_kes === 0 ? '#006644' : '#0a2540' }}>
                    {application.fee_kes === 0 ? 'Complimentary' : `KES ${application.fee_kes?.toLocaleString()}`}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Payment Status:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: application.payment?.status === 'Completed' ? '#006644' : '#64748b',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {application.fee_kes === 0 ? 'Exempt' : application.payment?.status || 'Pending Payment'}
                  </span>
                </div>

                {application.payment && (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '4px', fontSize: '12px', marginBottom: '12px' }}>
                    <div>Ref: <strong style={{ fontFamily: 'var(--font-mono)' }}>{application.payment.reference_number}</strong></div>
                    <div>Gateway Code: <strong style={{ fontFamily: 'var(--font-mono)' }}>{application.payment.transaction_reference}</strong></div>
                  </div>
                )}

                {application.payment?.status === 'Completed' && (
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Printer size={14} />
                    <span>View Revenue Receipt</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audit Status History Timeline */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Official Status Milestones</div>
              </div>
              <div className="gov-card-body" style={{ padding: '20px 18px' }}>
                <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #cbd5e1', marginLeft: '6px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {application.statusHistory?.map((h) => (
                    <div key={h.id} style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-26px',
                          top: '2px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#006644',
                          border: '2px solid #fff'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <StatusBadge status={h.new_status} size="sm" />
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(h.timestamp).toLocaleString('en-KE')}
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '6px 10px', lineHeight: 1.4 }}>
                        {h.remarks}
                        {h.changed_by_name && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            By: {h.changed_by_name} ({h.changed_by_role})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {showReceipt && application.payment && (
        <ReceiptModal
          payment={{
            ...application.payment,
            application_reference: application.reference_number,
            service_name: application.service_name,
            citizen_name: application.applicant_name,
            citizen_id: application.applicant_national_id
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
