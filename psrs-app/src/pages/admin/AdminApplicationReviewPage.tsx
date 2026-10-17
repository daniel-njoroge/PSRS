import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { ReceiptModal } from '../../components/ReceiptModal';
import type { Application, ApplicationStatus, User } from '../../types';
import {
  FileText,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  CreditCard,
  UserCheck,
  Shield,
  ArrowLeft,
  Printer,
  ChevronRight,
  Send
} from 'lucide-react';

export const AdminApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjudication Form State
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('Under Review');
  const [remarks, setRemarks] = useState('');
  const [actionRequiredNote, setActionRequiredNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [adjudicating, setAdjudicating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Staff Assignment State
  const [staffList, setStaffList] = useState<User[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assigningStaff, setAssigningStaff] = useState(false);

  // Receipt Modal
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; application: Application }>(`/applications/${id}`);
      if (res.success && res.application) {
        setApplication(res.application);
        setSelectedStatus(res.application.status);
        setAssignedStaffId(res.application.assigned_staff_id || '');
      } else {
        setError('Application record could not be loaded.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve application dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

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

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    if (selectedStatus === 'Action Required' && !actionRequiredNote.trim() && !remarks.trim()) {
      alert('Please specify what corrections or documents are required from the citizen.');
      return;
    }

    if (selectedStatus === 'Rejected' && !rejectionReason.trim() && !remarks.trim()) {
      alert('Please provide statutory reason for application rejection.');
      return;
    }

    try {
      setAdjudicating(true);
      setActionSuccess(null);

      const res = await api.patch<{ success: boolean; message: string; status: ApplicationStatus }>(
        `/applications/${application.id}/status`,
        {
          status: selectedStatus,
          remarks,
          action_required_note: actionRequiredNote,
          rejection_reason: rejectionReason,
          approval_remarks: approvalRemarks,
        }
      );

      if (res.success) {
        setActionSuccess(`Application status successfully transitioned to "${res.status}". Citizen notified.`);
        setRemarks('');
        await fetchApplication();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application status.');
    } finally {
      setAdjudicating(false);
    }
  };

  const handleStaffAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    try {
      setAssigningStaff(true);
      const res = await api.patch<{ success: boolean; message: string }>(`/applications/${application.id}/assign`, {
        staff_id: assignedStaffId || null,
      });

      if (res.success) {
        setActionSuccess(res.message);
        await fetchApplication();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign officer.');
    } finally {
      setAssigningStaff(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Loading adjudication workbench...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="gov-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="gov-alert gov-alert-danger" style={{ maxWidth: '520px', margin: '0 auto 20px auto' }}>
          <AlertCircle size={20} />
          <div>{error || 'Application record unavailable.'}</div>
        </div>
        <Link to="/admin/applications" className="btn btn-outline">
          Back to Register
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/admin/dashboard">{isAdmin ? 'Admin Console' : 'Workbench'}</Link>
          <span>/</span>
          <Link to="/admin/applications">Application Register</Link>
          <span>/</span>
          <span>Adjudicate: {application.reference_number}</span>
        </div>

        {/* Dossier Header Banner */}
        <div className="gov-card" style={{ marginBottom: '24px', borderTop: '4px solid #006644' }}>
          <div className="gov-card-body" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Republic of Kenya • Officer Adjudication Workbench
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)', marginTop: '2px' }}>
                  {application.reference_number}
                </h1>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                  {application.service_name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Supervising Department: <strong>{application.service_department}</strong> • Lodged on {new Date(application.created_at).toLocaleString('en-KE')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={application.status} size="md" />
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
                  Assigned Officer:{' '}
                  <strong>{application.assigned_staff_name || 'Unassigned'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="gov-alert gov-alert-success" style={{ marginBottom: '24px' }}>
            <CheckCircle2 size={20} />
            <div style={{ fontSize: '14px' }}>{actionSuccess}</div>
          </div>
        )}

        {/* 2-Column Adjudication Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '24px', alignItems: 'flex-start' }}>
          {/* LEFT: Applicant Info, Form Data & Uploaded Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Applicant Profile */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Applicant Identity Dossier</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Citizen Full Name:</span>
                    <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>{application.applicant_name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>National Identity No:</span>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{application.applicant_national_id}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Mobile Phone:</span>
                    <div style={{ fontWeight: 600 }}>{application.applicant_phone}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Email Address:</span>
                    <div style={{ fontWeight: 600 }}>{application.applicant_email}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>County of Domicile:</span>
                    <div>{application.applicant_county} County</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Sub-County:</span>
                    <div>{application.applicant_sub_county}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Form Fields */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Submitted Application Data</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(application.form_data || {}).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--gov-slate-200)',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ color: '#64748b', fontWeight: 500 }}>
                        {k.replace(/_/g, ' ').toUpperCase()}:
                      </span>
                      <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                        {String(v)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Uploaded Supporting Documents */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Attached Verification Documents ({application.documents?.length || 0})</div>
              </div>
              <div className="gov-card-body" style={{ padding: '16px' }}>
                {!application.documents || application.documents.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                    No supporting documents attached to this application.
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
                          href={doc.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={13} />
                          <span>Inspect Doc</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Adjudication Control Panel, Assignment & Audit Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Adjudication Workbench Action Panel */}
            <div className="gov-card" style={{ border: '2px solid #006644' }}>
              <div className="gov-card-header" style={{ backgroundColor: '#f0fdf4' }}>
                <div className="gov-card-title" style={{ color: '#006644', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={18} />
                  <span>Officer Adjudication Action</span>
                </div>
              </div>
              <div className="gov-card-body" style={{ padding: '20px' }}>
                <form onSubmit={handleStatusSubmit}>
                  <div className="form-group">
                    <label className="form-label">Update Application Status <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
                    >
                      <option value="Under Review">Under Review (Active investigation)</option>
                      <option value="Action Required">Action Required (Request citizen corrections)</option>
                      <option value="Approved">Approved (Statutory clearance granted)</option>
                      <option value="Completed">Completed (Final official certificate issued)</option>
                      <option value="Rejected">Rejected (Disqualified with reason)</option>
                    </select>
                  </div>

                  {/* Dynamic field for Action Required */}
                  {selectedStatus === 'Action Required' && (
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#dc2626' }}>
                        Specific Citizen Correction Note <span className="required">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        required
                        placeholder="e.g. Please re-upload a clearer scan of Fingerprint Form C-24..."
                        value={actionRequiredNote}
                        onChange={(e) => setActionRequiredNote(e.target.value)}
                      />
                      <div className="form-hint" style={{ color: '#dc2626' }}>
                        Citizen will be dispatched an immediate notification with these instructions.
                      </div>
                    </div>
                  )}

                  {/* Dynamic field for Rejection */}
                  {selectedStatus === 'Rejected' && (
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#dc2626' }}>
                        Statutory Rejection Reason <span className="required">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        required
                        placeholder="State statutory grounds under the relevant Act for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Dynamic field for Approval */}
                  {(selectedStatus === 'Approved' || selectedStatus === 'Completed') && (
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#006644' }}>
                        Official Registrar Endorsement Remarks
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="e.g. Verified against civil registry folio. Approved by Registrar..."
                        value={approvalRemarks}
                        onChange={(e) => setApprovalRemarks(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Internal Audit Notes & Remarks</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional internal administrative notes recorded into audit ledger..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '6px' }}
                    disabled={adjudicating}
                  >
                    <Send size={15} />
                    <span>{adjudicating ? 'Updating Status...' : 'Commit Status Transition'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Officer Assignment Panel */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Assign Processing Officer</div>
              </div>
              <div className="gov-card-body" style={{ padding: '18px' }}>
                <form onSubmit={handleStaffAssign} style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-control"
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="btn btn-navy btn-sm"
                    disabled={assigningStaff}
                  >
                    {assigningStaff ? '...' : 'Assign'}
                  </button>
                </form>
              </div>
            </div>

            {/* Payment Record */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Revenue Payment Clearance</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Statutory Fee:</span>
                  <strong style={{ fontSize: '16px', color: application.fee_kes === 0 ? '#006644' : '#0a2540' }}>
                    {application.fee_kes === 0 ? 'Complimentary' : `KES ${application.fee_kes?.toLocaleString()}`}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Remittance Status:</span>
                  <span style={{ fontWeight: 700, color: application.payment?.status === 'Completed' ? '#006644' : '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                    {application.fee_kes === 0 ? 'Exempt' : application.payment?.status || 'Pending Payment'}
                  </span>
                </div>

                {application.payment && (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '4px', fontSize: '12px', marginBottom: '12px' }}>
                    <div>Receipt: <strong style={{ fontFamily: 'var(--font-mono)' }}>{application.payment.reference_number}</strong></div>
                    <div>Gateway Code: <strong style={{ fontFamily: 'var(--font-mono)' }}>{application.payment.transaction_reference}</strong></div>
                  </div>
                )}

                {application.payment?.status === 'Completed' && (
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Printer size={13} />
                    <span>View Revenue Receipt</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Immutable Status Timeline</div>
              </div>
              <div className="gov-card-body" style={{ padding: '18px 16px' }}>
                <div style={{ position: 'relative', paddingLeft: '18px', borderLeft: '2px solid #cbd5e1', marginLeft: '6px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {application.statusHistory?.map((h) => (
                    <div key={h.id} style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-24px',
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
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(h.timestamp).toLocaleString('en-KE')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '6px 10px', lineHeight: 1.4 }}>
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
            citizen_id: application.applicant_national_id,
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
