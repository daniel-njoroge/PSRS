import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Service } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronLeft
} from 'lucide-react';

export const ServiceDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ success: boolean; service: Service }>(`/services/${idOrSlug}`);
        if (res.success && res.service) {
          setService(res.service);
        } else {
          setError('Public service details could not be found.');
        }
      } catch (err: any) {
        setError(err.message || 'Service not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [idOrSlug]);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Loading service specifications...
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
        <Link to="/services" className="btn btn-outline">
          <ChevronLeft size={16} />
          <span>Back to Services Directory</span>
        </Link>
      </div>
    );
  }

  const handleApplyClick = () => {
    if (!user) {
      navigate(`/login?redirect=/citizen/apply/${service.id}`);
    } else {
      navigate(`/citizen/apply/${service.id}`);
    }
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/services">Services Directory</Link>
          <span>/</span>
          <span>{service.name}</span>
        </div>

        {/* Top Header Card */}
        <div className="gov-card" style={{ marginBottom: '28px', borderLeft: '4px solid #006644' }}>
          <div className="gov-card-body" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                {service.category}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                {service.department}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gov-navy-900)', marginBottom: '12px' }}>
                  {service.name}
                </h1>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>
                  {service.description}
                </p>
              </div>

              {/* Action Box */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '20px', minWidth: '240px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Statutory Fee</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: service.fee_kes === 0 ? '#006644' : '#0a2540', margin: '4px 0 14px 0' }}>
                  {service.fee_kes === 0 ? 'Complimentary' : `KES ${service.fee_kes.toLocaleString()}`}
                </div>
                <button
                  onClick={handleApplyClick}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', fontSize: '15px' }}
                >
                  <span>Apply for Service</span>
                  <ArrowRight size={16} />
                </button>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  Digital pre-application through PSRS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Specification Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Eligibility Panel */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Eligibility Criteria</div>
              </div>
              <div className="gov-card-body">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="#006644" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                    {service.eligibility}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Verification Documents */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Required Supporting Documents</div>
              </div>
              <div className="gov-card-body">
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Please ensure digital copies (PDF, JPG, or PNG, under 5MB each) are scanned and legible before initiating your application.
                </p>

                {service.required_documents?.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '13px' }}>
                    No physical document uploads are mandatory for this civic request.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {service.required_documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        style={{
                          border: '1px solid var(--gov-slate-200)',
                          borderRadius: '4px',
                          padding: '12px 16px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '14px' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {doc.description}
                          </div>
                        </div>
                        <div>
                          {doc.required ? (
                            <span style={{ fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '3px', fontWeight: 700 }}>
                              MANDATORY
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                              OPTIONAL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Application Instructions */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Application Guidelines & Procedures</div>
              </div>
              <div className="gov-card-body">
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
                  {service.instructions}
                </p>
                <div className="gov-alert gov-alert-info" style={{ marginBottom: 0 }}>
                  <ShieldCheck size={18} />
                  <div style={{ fontSize: '13px' }}>
                    <strong>Statutory Notice:</strong> False declarations or forged verification documents constitute criminal offences under the Penal Code (Cap 63) of the Laws of Kenya.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Service At a Glance</div>
              </div>
              <div className="gov-card-body" style={{ padding: 0 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gov-slate-200)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Standard Processing SLA</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-navy-900)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="#006644" />
                    <span>{service.processing_time_days} {service.processing_time_days === 1 ? 'Business Day' : 'Business Days'}</span>
                  </div>
                </div>

                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gov-slate-200)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Statutory Government Fee</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: service.fee_kes === 0 ? '#006644' : '#0a2540', marginTop: '2px' }}>
                    {service.fee_kes === 0 ? 'Free (KES 0.00)' : `KES ${service.fee_kes.toLocaleString()}`}
                  </div>
                </div>

                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gov-slate-200)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Accepted Payment Channels</div>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
                    • M-Pesa Express (Simulated STK Push)<br />
                    • Debit / Credit Card (Visa & Mastercard)
                  </div>
                </div>

                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Supervising Agency</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gov-navy-900)', marginTop: '2px' }}>
                    {service.department}
                  </div>
                </div>
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="gov-card" style={{ backgroundColor: '#f8fafc' }}>
              <div className="gov-card-body" style={{ padding: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gov-navy-900)', marginBottom: '6px' }}>
                  Need Assistance with this Request?
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                  Reach out to the Public Service Helpdesk or consult our citizen service charter for clarification.
                </p>
                <Link to="/help" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  Citizen Support & FAQs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
