import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ReceiptModal } from '../../components/ReceiptModal';
import type { Payment } from '../../types';
import { CreditCard, Printer, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; payments: Payment[]; total_revenue_kes: number }>('/payments');
        if (res.success) {
          setPayments(res.payments || []);
          setTotalRevenue(res.total_revenue_kes || 0);
        }
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.reference_number.toLowerCase().includes(term) ||
      p.transaction_reference.toLowerCase().includes(term) ||
      (p.service_name && p.service_name.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/citizen/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Payments & Statements</span>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Statutory Fee Payments & Revenue Receipts
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Verifiable electronic ledger of all statutory fee remittances and government treasury receipts.
            </p>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 18px', borderRadius: '4px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Total Remitted</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#006644' }}>
              KES {totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ position: 'relative', maxWidth: '380px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px', height: '38px' }}
                placeholder="Search by Receipt #, M-Pesa Code, or Service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading transaction ledger...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <CreditCard size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No Payment Records Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                  There are no payment transactions associated with this citizen account.
                </p>
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Receipt Number</th>
                      <th>Application Ref</th>
                      <th>Service Remitted For</th>
                      <th>Amount (KES)</th>
                      <th>Gateway & Method</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)' }}>
                          {p.reference_number}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          <Link to={`/citizen/applications/${p.application_id}`} style={{ color: '#006644', textDecoration: 'none', fontWeight: 600 }}>
                            {p.application_reference || 'Dossier'}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 600, color: '#334155' }}>
                          {p.service_name || 'Public Service Fee'}
                        </td>
                        <td style={{ fontWeight: 800, color: '#006644' }}>
                          KES {p.amount_kes.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>
                            {p.payment_method}
                          </div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                            Code: {p.transaction_reference}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '3px',
                              backgroundColor: p.status === 'Completed' ? '#ecfdf5' : '#fffbeb',
                              color: p.status === 'Completed' ? '#065f46' : '#92400e',
                              border: `1px solid ${p.status === 'Completed' ? '#a7f3d0' : '#fde68a'}`
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {new Date(p.created_at).toLocaleDateString('en-KE')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedReceipt(p)}
                          >
                            <Printer size={13} />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
