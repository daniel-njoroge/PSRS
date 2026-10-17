import React from 'react';
import type { Payment } from '../types';
import { Printer, X, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#006644" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Statutory Payment Receipt</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="gov-receipt">
            <div className="receipt-header">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Republic of Kenya • National Treasury
              </div>
              <h2>OFFICIAL REVENUE RECEIPT</h2>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                Public Service Request System (PSRS)
              </div>
            </div>

            <div className="receipt-grid">
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Receipt Number</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{payment.reference_number}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Transaction Reference</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{payment.transaction_reference}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Application Reference</div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{payment.application_reference || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Payment Date & Time</div>
                <div style={{ fontWeight: 500 }}>
                  {payment.paid_at ? new Date(payment.paid_at).toLocaleString('en-KE') : new Date(payment.created_at).toLocaleString('en-KE')}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gov-slate-200)', paddingTop: '12px', marginBottom: '14px' }}>
              <div className="receipt-line">
                <span style={{ color: '#475569' }}>Payer Full Name:</span>
                <span style={{ fontWeight: 600 }}>{payment.citizen_name || 'Citizen Applicant'}</span>
              </div>
              {payment.citizen_id && (
                <div className="receipt-line">
                  <span style={{ color: '#475569' }}>National ID Number:</span>
                  <span style={{ fontWeight: 600 }}>{payment.citizen_id}</span>
                </div>
              )}
              {payment.phone_number && (
                <div className="receipt-line">
                  <span style={{ color: '#475569' }}>Payer Mobile Number:</span>
                  <span style={{ fontWeight: 500 }}>{payment.phone_number}</span>
                </div>
              )}
              <div className="receipt-line">
                <span style={{ color: '#475569' }}>Service Description:</span>
                <span style={{ fontWeight: 600 }}>{payment.service_name || 'Public Service Fee'}</span>
              </div>
              <div className="receipt-line">
                <span style={{ color: '#475569' }}>Payment Method:</span>
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{payment.payment_method}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL STATUTORY AMOUNT PAID</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#006644' }}>
                KES {payment.amount_kes.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                STATUS: PAYMENT VERIFIED & CLEARED
              </div>
            </div>

            <div className="receipt-stamp">
              ✓ OFFICIAL GOVERNMENT TREASURY REVENUE STAMP — VERIFIED
            </div>

            <div style={{ marginTop: '16px', fontSize: '11px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
              DISCLAIMER: This is an electronic verification receipt generated by the Kenya Public Service Request Sandbox for demonstration purposes. Retain this reference for official service collection.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
