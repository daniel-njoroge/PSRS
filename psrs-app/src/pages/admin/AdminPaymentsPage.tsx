import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ReceiptModal } from '../../components/ReceiptModal';
import type { Payment } from '../../types';
import {
  CreditCard,
  Download,
  Printer,
  Search,
  Filter,
  TrendingUp,
  FileText
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (methodFilter !== 'All') params.set('method', methodFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get<{
        success: boolean;
        total: number;
        total_revenue_kes: number;
        payments: Payment[];
      }>(`/payments?${params.toString()}`);

      if (res.success) {
        setPayments(res.payments || []);
        setTotalRevenue(res.total_revenue_kes || 0);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  // CSV Export simulation
  const handleExportCSV = () => {
    if (payments.length === 0) return;

    const headers = ['Receipt Ref', 'Application Ref', 'Citizen Name', 'National ID', 'Service', 'Amount KES', 'Method', 'Gateway Code', 'Status', 'Date'];
    const rows = payments.map(p => [
      p.reference_number,
      p.application_reference || '',
      `"${p.citizen_name || ''}"`,
      p.citizen_national_id || '',
      `"${p.service_name || ''}"`,
      p.amount_kes,
      p.payment_method,
      p.transaction_reference,
      p.status,
      new Date(p.created_at).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PSRS_Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/admin/dashboard">Admin Console</Link>
          <span>/</span>
          <span>Revenue Ledger & Reports</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              National Treasury Revenue Ledger & Financial Reports
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Statutory fee collections, electronic receipts reconciliation, and transaction audits.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: '4px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue Cleared</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#006644' }}>
                KES {totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              disabled={payments.length === 0}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    placeholder="Search by Receipt #, Payer, or M-Pesa Code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-navy btn-sm">Search</button>
              </form>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Method:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '130px' }}
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                  >
                    <option value="All">All Channels</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '130px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading financial records...
              </div>
            ) : payments.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <CreditCard size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No Financial Records Found
                </h3>
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Receipt Number</th>
                      <th>Application Ref</th>
                      <th>Payer Citizen</th>
                      <th>Service Remitted</th>
                      <th>Amount (KES)</th>
                      <th>Method & Code</th>
                      <th>Status</th>
                      <th>Cleared Date</th>
                      <th style={{ textAlign: 'right' }}>Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--gov-navy-900)' }}>
                          {p.reference_number}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          <Link to={`/admin/applications/${p.application_id}/review`} style={{ color: '#006644', textDecoration: 'none', fontWeight: 600 }}>
                            {p.application_reference || 'Dossier'}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)', fontSize: '13px' }}>
                            {p.citizen_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ID: {p.citizen_national_id}
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#334155' }}>
                          {p.service_name}
                        </td>
                        <td style={{ fontWeight: 800, color: '#006644' }}>
                          KES {p.amount_kes.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>
                            {p.payment_method}
                          </div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                            {p.transaction_reference}
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
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
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
