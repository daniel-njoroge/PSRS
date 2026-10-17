import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ReceiptModal } from '../../components/ReceiptModal';
import type { Service, Payment } from '../../types';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Clock,
  Smartphone,
  Printer
} from 'lucide-react';

export const ApplyServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard step: 1 (Citizen Details), 2 (Dynamic Form), 3 (Documents), 4 (Review & Submit), 5 (Payment & Completed)
  const [currentStep, setCurrentStep] = useState(1);

  // Dynamic Form Values
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Uploaded Files
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    referenceNumber: string;
    fee_kes: number;
  } | null>(null);

  // Payment Checkout State
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'prompt_sent' | 'paid'>('idle');
  const [activePaymentRecord, setActivePaymentRecord] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; service: Service }>(`/services/${serviceId}`);
        if (res.success && res.service) {
          setService(res.service);
          // Initialize form data defaults
          const defaults: Record<string, any> = {};
          res.service.form_fields.forEach((f) => {
            if (f.type === 'select' && f.options && f.options.length > 0) {
              defaults[f.name] = f.options[0];
            } else {
              defaults[f.name] = '';
            }
          });
          setFormData(defaults);
        } else {
          setError('Public service could not be loaded.');
        }
      } catch (err: any) {
        setError(err.message || 'Service not found.');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [serviceId]);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Loading application framework...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="gov-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="gov-alert gov-alert-danger" style={{ maxWidth: '540px', margin: '0 auto 20px auto' }}>
          <AlertCircle size={20} />
          <div>{error || 'Service not found.'}</div>
        </div>
        <Link to="/services" className="btn btn-outline">Back to Services</Link>
      </div>
    );
  }

  // Handle Dynamic Field Change
  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle File Upload Change
  const handleFileChange = (docName: string, file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 5MB statutory limit.`);
      return;
    }

    setUploadedFiles((prev) => ({ ...prev, [docName]: file }));
  };

  // Step 2 Validation
  const validateStep2 = () => {
    for (const field of service.form_fields) {
      if (field.required && (!formData[field.name] || String(formData[field.name]).trim() === '')) {
        alert(`Field "${field.label || field.name}" is required.`);
        return false;
      }
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    for (const doc of service.required_documents) {
      if (doc.required && !uploadedFiles[doc.name]) {
        alert(`Mandatory supporting document "${doc.name}" must be attached.`);
        return false;
      }
    }
    return true;
  };

  // Submit Application Form to Backend
  const handleSubmitApplication = async () => {
    if (!declarationAgreed) {
      alert('You must confirm the statutory declaration statement.');
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = new FormData();
      submissionData.append('service_id', service.id);
      submissionData.append('form_data', JSON.stringify(formData));
      submissionData.append('is_draft', 'false');

      // Append files
      Object.entries(uploadedFiles).forEach(([docName, file]) => {
        submissionData.append(docName, file);
      });

      const res = await api.post<{
        success: boolean;
        message: string;
        applicationId: string;
        referenceNumber: string;
        fee_kes: number;
      }>('/applications', submissionData);

      if (res.success) {
        setSubmissionResult({
          applicationId: res.applicationId,
          referenceNumber: res.referenceNumber,
          fee_kes: res.fee_kes,
        });

        if (res.fee_kes > 0) {
          setCurrentStep(5); // Move to Payment Checkout
        } else {
          setCurrentStep(5); // Free service complete
          setPaymentStep('paid');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Simulated Payment
  const handleInitiatePayment = async () => {
    if (!submissionResult) return;
    try {
      setPaymentProcessing(true);

      const initRes = await api.post<{
        success: boolean;
        payment: { id: string; transaction_reference: string };
      }>('/payments/initiate', {
        application_id: submissionResult.applicationId,
        payment_method: paymentMethod,
        phone_number: paymentPhone,
      });

      if (initRes.success && initRes.payment) {
        setPaymentStep('prompt_sent');

        // Simulate 2-second user STK push confirmation on mobile handset
        setTimeout(async () => {
          try {
            const confirmRes = await api.post<{
              success: boolean;
              receipt_number: string;
              transaction_reference: string;
            }>('/payments/confirm', {
              payment_id: initRes.payment.id,
              simulation_action: 'approve',
            });

            if (confirmRes.success) {
              setPaymentStep('paid');

              // Fetch receipt details
              const receiptRes = await api.get<{ success: boolean; receipt: Payment }>(`/payments/receipt/${initRes.payment.id}`);
              if (receiptRes.success) {
                setActivePaymentRecord(receiptRes.receipt);
              }
            }
          } catch (e) {
            console.error('Confirm error:', e);
          } finally {
            setPaymentProcessing(false);
          }
        }, 2200);
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed.');
      setPaymentProcessing(false);
    }
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container" style={{ maxWidth: '900px' }}>
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/services">Services</Link>
          <span>/</span>
          <span>Apply: {service.name}</span>
        </div>

        {/* Wizard Step Progression */}
        <div className="step-wizard">
          <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Applicant Details</span>
          </div>
          <div className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Service Form</span>
          </div>
          <div className={`step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <span>Supporting Documents</span>
          </div>
          <div className={`step-item ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <span>Review & Declaration</span>
          </div>
          <div className={`step-item ${currentStep === 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <span>{service.fee_kes > 0 ? 'Fee Remittance' : 'Confirmation'}</span>
          </div>
        </div>

        {/* STEP 1: Applicant Information & Eligibility Confirmation */}
        {currentStep === 1 && (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Step 1: Applicant Profile & Eligibility Verification</div>
            </div>
            <div className="gov-card-body" style={{ padding: '24px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '15px', marginBottom: '10px' }}>
                  Registered Citizen Profile Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Full Legal Name:</span>{' '}
                    <strong>{user?.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>National ID Number:</span>{' '}
                    <strong>{user?.national_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Primary Mobile Number:</span>{' '}
                    <strong>{user?.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>County of Domicile:</span>{' '}
                    <strong>{user?.county} County ({user?.sub_county})</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                  Service Statutory Summary
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', background: '#f1f5f9', padding: '12px 16px', borderRadius: '4px' }}>
                  <div>Category: <strong>{service.category}</strong></div>
                  <div>Department: <strong>{service.department}</strong></div>
                  <div>Statutory Fee: <strong>{service.fee_kes === 0 ? 'Free' : `KES ${service.fee_kes.toLocaleString()}`}</strong></div>
                  <div>Turnaround SLA: <strong>{service.processing_time_days} Business Days</strong></div>
                </div>
              </div>

              <div className="gov-alert gov-alert-info" style={{ marginBottom: '24px' }}>
                <ShieldCheck size={20} />
                <div style={{ fontSize: '13px' }}>
                  <strong>Eligibility Affirmation:</strong> By continuing, you affirm that you satisfy the criteria: "{service.eligibility}".
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(2)}
                >
                  <span>Proceed to Service Form</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Dynamic Service Specific Form Fields */}
        {currentStep === 2 && (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Step 2: Service Application Form — {service.name}</div>
            </div>
            <div className="gov-card-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                Complete the statutory fields below. Mandatory entries are indicated with an asterisk (*).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {service.form_fields.map((field) => (
                  <div key={field.name} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      {field.label} {field.required && <span className="required">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        className="form-control"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder={field.placeholder || ''}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="form-control"
                        placeholder={field.placeholder || ''}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                >
                  <span>Proceed to Documents</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Mandatory Document Uploads */}
        {currentStep === 3 && (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Step 3: Verification Document Attachments</div>
            </div>
            <div className="gov-card-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                Upload digital scans for verification. Allowed formats: PDF, JPG, PNG (Max 5MB per document).
              </p>

              {service.required_documents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '4px', color: '#64748b' }}>
                  No supporting documents are mandatory for this application.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {service.required_documents.map((doc) => {
                    const existingFile = uploadedFiles[doc.name];
                    return (
                      <div
                        key={doc.id || doc.name}
                        style={{
                          border: '1px solid var(--gov-slate-200)',
                          borderRadius: '4px',
                          padding: '16px',
                          backgroundColor: existingFile ? '#f0fdf4' : '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '14px' }}>
                              {doc.name}
                            </span>
                            {doc.required && (
                              <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
                                REQUIRED
                              </span>
                            )}
                          </div>
                          {existingFile && (
                            <span style={{ fontSize: '12px', color: '#006644', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} /> Attached
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                          {doc.description}
                        </div>

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleFileChange(doc.name, e.target.files?.[0] || null)}
                          style={{ fontSize: '13px' }}
                        />
                        {existingFile && (
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                            File: <strong>{existingFile.name}</strong> ({(existingFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (validateStep3()) setCurrentStep(4);
                  }}
                >
                  <span>Review Application</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Statutory Declaration */}
        {currentStep === 4 && (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Step 4: Review Dossier & Affirm Declaration</div>
            </div>
            <div className="gov-card-body" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '12px' }}>
                Application Summary
              </h3>

              <div style={{ background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>Service: <strong>{service.name}</strong></div>
                  <div>Department: <strong>{service.department}</strong></div>
                  <div>Applicant: <strong>{user?.full_name}</strong></div>
                  <div>National ID: <strong>{user?.national_id}</strong></div>
                </div>

                <div style={{ borderTop: '1px solid var(--gov-slate-200)', marginTop: '12px', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Entered Form Data:
                  </div>
                  {Object.entries(formData).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <span style={{ color: '#475569' }}>{k.replace(/_/g, ' ').toUpperCase()}:</span>
                      <strong style={{ color: '#0f172a' }}>{String(v)}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--gov-slate-200)', marginTop: '12px', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Attached Documents ({Object.keys(uploadedFiles).length}):
                  </div>
                  {Object.entries(uploadedFiles).map(([k, f]) => (
                    <div key={k} style={{ fontSize: '12px', color: '#006644', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>{k}: <strong>{f.name}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: '4px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>APPLICABLE STATUTORY FEE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#006644' }}>
                    {service.fee_kes === 0 ? 'Complimentary (Free)' : `KES ${service.fee_kes.toLocaleString()}`}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  Payable via Simulated M-Pesa Express or Card
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={declarationAgreed}
                    onChange={(e) => setDeclarationAgreed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    <strong>Statutory Declaration:</strong> I solemnly declare under the Oaths and Statutory Declarations Act (Cap 15) that the statements made herein and documents uploaded are authentic, accurate, and truthful.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(3)}
                  disabled={submitting}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Documents</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitApplication}
                  disabled={submitting || !declarationAgreed}
                >
                  <span>{submitting ? 'Lodging Application...' : 'Lodge & Submit Application'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Payment Checkout (Sandbox) or Final Confirmation */}
        {currentStep === 5 && submissionResult && (
          <div className="gov-card" style={{ borderTop: '4px solid #006644' }}>
            <div className="gov-card-body" style={{ padding: '32px' }}>
              {paymentStep !== 'paid' ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', marginBottom: '12px' }}>
                      <Smartphone size={32} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                      Statutory Fee Checkout (Sandbox)
                    </h2>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      Application Reference: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)' }}>{submissionResult.referenceNumber}</strong>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '16px', maxWidth: '480px', margin: '0 auto 24px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Amount to Remit</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#006644' }}>
                      KES {submissionResult.fee_kes.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Service: {service.name}
                    </div>
                  </div>

                  {paymentStep === 'prompt_sent' ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', maxWidth: '420px', margin: '0 auto' }}>
                      <div className="gov-alert gov-alert-warning" style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <Clock size={20} />
                        <div>
                          <strong>Simulating M-Pesa STK Push:</strong> A simulated USSD payment request has been sent to <strong>{paymentPhone}</strong>. Waiting for PIN entry...
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #006644', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                      <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button
                            type="button"
                            className={`btn ${paymentMethod === 'mpesa' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setPaymentMethod('mpesa')}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Smartphone size={16} /> M-Pesa Express
                          </button>
                          <button
                            type="button"
                            className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setPaymentMethod('card')}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <CreditCard size={16} /> Credit / Debit Card
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'mpesa' ? (
                        <div className="form-group">
                          <label className="form-label">M-Pesa Mobile Number</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            placeholder="e.g. 0712345678"
                          />
                          <div className="form-hint">
                            Simulated test gateway: No real airtime or money is debited.
                          </div>
                        </div>
                      ) : (
                        <div className="gov-alert gov-alert-info">
                          <div>Simulated Visa/Mastercard test environment.</div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: '16px' }}
                        onClick={handleInitiatePayment}
                        disabled={paymentProcessing}
                      >
                        <CreditCard size={18} />
                        <span>Pay Statutory Fee (KES {submissionResult.fee_kes.toLocaleString()})</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Payment Settled / Complimentary Application Completed */
                <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto' }}>
                  <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', background: '#ecfdf5', color: '#006644', marginBottom: '16px' }}>
                    <CheckCircle2 size={44} />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                    Application Lodged Successfully
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
                    Your service application for <strong>{service.name}</strong> has been assigned an institutional tracking reference code.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '20px', margin: '24px 0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Official Tracking Reference</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)', marginTop: '4px' }}>
                      {submissionResult.referenceNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#006644', fontWeight: 600, marginTop: '8px' }}>
                      ✓ Status: Submitted • Sent to {service.department}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {activePaymentRecord && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowReceiptModal(true)}
                      >
                        <Printer size={16} />
                        <span>View Revenue Receipt</span>
                      </button>
                    )}
                    <Link
                      to={`/citizen/applications/${submissionResult.applicationId}`}
                      className="btn btn-primary"
                    >
                      <span>View Application Dossier</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/citizen/dashboard" className="btn btn-outline">
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      {showReceiptModal && activePaymentRecord && (
        <ReceiptModal
          payment={activePaymentRecord}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
