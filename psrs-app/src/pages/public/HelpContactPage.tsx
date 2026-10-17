import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { FAQ } from '../../types';
import {
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';

export const HelpContactPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // Support Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await api.get<{ success: boolean; faqs: FAQ[] }>('/help/faqs');
        if (res.success) {
          setFaqs(res.faqs || []);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoadingFaqs(false);
      }
    }
    fetchFaqs();
  }, []);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTicketSubmitting(true);
      setTicketError(null);
      setTicketSuccess(null);

      const res = await api.post<{ success: boolean; message: string; ticketNumber: string }>('/help/tickets', ticketForm);
      if (res.success) {
        setTicketSuccess(`Support request lodged successfully! Your Tracking Ticket is #${res.ticketNumber}. A helpdesk officer will respond via email/SMS.`);
        setTicketForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err: any) {
      setTicketError(err.message || 'Failed to submit inquiry. Please check your inputs.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Help, Support & Citizen Charter</span>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Help Center & Citizen Inquiries
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Frequently Asked Questions, Public Service Charter, Contact Directory, and Citizen Support Ticketing.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px', alignItems: 'flex-start' }}>
          {/* Left Column: FAQs & Citizen Charter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* FAQs */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="#006644" />
                  <span>Frequently Asked Questions</span>
                </div>
              </div>
              <div className="gov-card-body">
                {loadingFaqs ? (
                  <div style={{ color: '#64748b', padding: '20px 0' }}>Loading questions...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {faqs.map((faq) => (
                      <div key={faq.id} style={{ borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--gov-navy-900)', marginBottom: '6px' }}>
                          {faq.question}
                        </div>
                        <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                          {faq.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy & Legal Terms */}
            <div className="gov-card" id="privacy">
              <div className="gov-card-header">
                <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#006644" />
                  <span>Data Protection & Statutory Transparency</span>
                </div>
              </div>
              <div className="gov-card-body">
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '10px' }}>
                  <strong>Kenyan Data Protection Act (2019):</strong> All personal information collected (including National ID numbers, biometric notification slips, and mobile contact details) is strictly utilized for civil status verification and service fulfillment. Records are never disclosed to unauthorized third parties or commercial entities.
                </p>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  <strong>Demonstration Notice:</strong> This software installation operates as an institutional prototype and technical sandbox. While workflows mirror actual eCitizen procedures, no actual government revenues are banked.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form & Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Support Ticket Submission */}
            <div className="gov-card" id="contact">
              <div className="gov-card-header">
                <div className="gov-card-title">Submit Citizen Support Ticket</div>
              </div>
              <div className="gov-card-body">
                {ticketSuccess && (
                  <div className="gov-alert gov-alert-success" style={{ marginBottom: '16px' }}>
                    <CheckCircle2 size={18} />
                    <div style={{ fontSize: '13px' }}>{ticketSuccess}</div>
                  </div>
                )}

                {ticketError && (
                  <div className="gov-alert gov-alert-danger" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={18} />
                    <div style={{ fontSize: '13px' }}>{ticketError}</div>
                  </div>
                )}

                <form onSubmit={handleTicketSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Daniel Njoroge"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="e.g. citizen@example.ke"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kenyan Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 0712345678"
                      value={ticketForm.phone}
                      onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject / Service Area <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Inquiry on Birth Certificate delay"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Message <span className="required">*</span></label>
                    <textarea
                      className="form-control"
                      rows={4}
                      required
                      placeholder="Describe your inquiry, including relevant reference number if available..."
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={ticketSubmitting}
                  >
                    <Send size={15} />
                    <span>{ticketSubmitting ? 'Lodging Ticket...' : 'Send Support Request'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Public Service Contacts */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title">Official Directory & Hotlines</div>
              </div>
              <div className="gov-card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <MapPin size={18} color="#006644" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--gov-navy-900)' }}>Central Public Service Bureau:</strong>
                      <div style={{ color: '#64748b' }}>Avenue, Nairobi</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Phone size={18} color="#006644" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--gov-navy-900)' }}>Citizen Helpline (Toll-Free):</strong>
                      <div style={{ color: '#64748b' }}>0800 000 000 / +254 (020) 1111111</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Mail size={18} color="#006644" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--gov-navy-900)' }}>Email Inquiries:</strong>
                      <div style={{ color: '#64748b' }}>helpdesk@psrs.go.ke</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Clock size={18} color="#006644" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--gov-navy-900)' }}>Operating Hours:</strong>
                      <div style={{ color: '#64748b' }}>Monday – Friday: 8:00 AM – 5:00 PM (EAT)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
