import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Service } from '../../types';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Clock,
  Shield,
  Search,
  X
} from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Service Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Civil Registration',
    department: '',
    fee_kes: 0,
    processing_time_days: 3,
    description: '',
    eligibility: 'All eligible Kenyan citizens and registered entities.',
    instructions: 'Complete online form and submit verification scans.',
  });
  const [creating, setCreating] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; services: Service[] }>('/services?includeInactive=true');
      if (res.success) {
        setServices(res.services || []);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string }>(`/services/${id}/toggle-status`);
      if (res.success) {
        await fetchServices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle service status.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post<{ success: boolean; message: string }>('/services', {
        ...serviceForm,
        required_documents: [
          { id: 'doc-id', name: 'National ID Copy', required: true, description: 'Copy of valid Kenyan ID card' }
        ],
        form_fields: [
          { name: 'applicant_notes', label: 'Particulars & Remarks', type: 'textarea', required: true, placeholder: 'Enter details...' }
        ]
      });

      if (res.success) {
        setShowCreateModal(false);
        setServiceForm({
          name: '',
          category: 'Civil Registration',
          department: '',
          fee_kes: 0,
          processing_time_days: 3,
          description: '',
          eligibility: 'All eligible Kenyan citizens and registered entities.',
          instructions: 'Complete online form and submit verification scans.',
        });
        await fetchServices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create service.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = services.filter((s) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.department.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/admin/dashboard">Admin Console</Link>
          <span>/</span>
          <span>Services Catalog Management</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Public Services Catalog Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Configure statutory fees, SLAs, document requirements, and activation states.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle size={15} />
            <span>Publish New Service</span>
          </button>
        </div>

        {/* Search */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ position: 'relative', maxWidth: '380px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px', height: '38px' }}
                placeholder="Filter services by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading service catalog...
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Supervising Department</th>
                      <th>Fee (KES)</th>
                      <th>Turnaround SLA</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((svc) => (
                      <tr key={svc.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                            {svc.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Slug: {svc.slug}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                            {svc.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#334155' }}>
                          {svc.department}
                        </td>
                        <td style={{ fontWeight: 700, color: svc.fee_kes === 0 ? '#006644' : '#0f172a' }}>
                          {svc.fee_kes === 0 ? 'Complimentary' : `KES ${svc.fee_kes.toLocaleString()}`}
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {svc.processing_time_days} {svc.processing_time_days === 1 ? 'Day' : 'Days'}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '3px',
                              backgroundColor: svc.is_active ? '#ecfdf5' : '#f1f5f9',
                              color: svc.is_active ? '#065f46' : '#64748b',
                              border: `1px solid ${svc.is_active ? '#a7f3d0' : '#cbd5e1'}`
                            }}
                          >
                            {svc.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${svc.is_active ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(svc.id)}
                            style={{ fontSize: '12px' }}
                          >
                            {svc.is_active ? 'Disable' : 'Activate'}
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

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Publish New Public Service</div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Land Title Replacement Application"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Sector / Category <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    >
                      <option value="Civil Registration">Civil Registration</option>
                      <option value="Identity & Immigration">Identity & Immigration</option>
                      <option value="Police Services">Police Services</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supervising Department <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Ministry of Lands"
                      value={serviceForm.department}
                      onChange={(e) => setServiceForm({ ...serviceForm, department: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Statutory Fee (KES) <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      required
                      value={serviceForm.fee_kes}
                      onChange={(e) => setServiceForm({ ...serviceForm, fee_kes: parseFloat(e.target.value) || 0 })}
                    />
                    <div className="form-hint">Enter 0 for complimentary service.</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Standard SLA (Business Days) <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      required
                      value={serviceForm.processing_time_days}
                      onChange={(e) => setServiceForm({ ...serviceForm, processing_time_days: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Scope <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    rows={2}
                    required
                    placeholder="Brief statutory overview of what this service covers..."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Who is eligible to apply?"
                    value={serviceForm.eligibility}
                    onChange={(e) => setServiceForm({ ...serviceForm, eligibility: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Publishing...' : 'Publish Service to Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
