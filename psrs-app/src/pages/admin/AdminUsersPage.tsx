import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { User, UserRole } from '../../types';
import {
  Users,
  UserCheck,
  Shield,
  Search,
  PlusCircle,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Edit Modal
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('citizen');
  const [newDepartment, setNewDepartment] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Create Staff Modal
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    national_id: '',
    email: '',
    phone: '',
    department: 'Civil Registration Services',
    county: 'Nairobi',
    sub_county: 'Nyayo House',
    password: '',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'All') params.set('role', roleFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get<{ success: boolean; total: number; users: User[] }>(`/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.users || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string }>(`/users/${id}/toggle-status`);
      if (res.success) {
        await fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleUser) return;

    try {
      setUpdatingRole(true);
      const res = await api.patch<{ success: boolean; message: string }>(`/users/${editRoleUser.id}/role`, {
        role: newRole,
        department: newRole === 'staff' ? newDepartment : null,
      });

      if (res.success) {
        setEditRoleUser(null);
        await fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingStaff(true);
      const res = await api.post<{ success: boolean; message: string }>('/users/staff', {
        ...staffForm,
        role: 'staff',
      });

      if (res.success) {
        setShowCreateStaffModal(false);
        setStaffForm({
          full_name: '',
          national_id: '',
          email: '',
          phone: '',
          department: 'Civil Registration Services',
          county: 'Nairobi',
          sub_county: 'Nyayo House',
          password: '',
        });
        await fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account.');
    } finally {
      setCreatingStaff(false);
    }
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
          <span>User Administration</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Citizen & Staff User Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Manage registered citizen profiles, staff departmental roles, and access controls.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateStaffModal(true)}
          >
            <PlusCircle size={15} />
            <span>Provision Staff Officer</span>
          </button>
        </div>

        {/* Filters */}
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '38px' }}
                    placeholder="Search by Name, National ID, or Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-navy btn-sm">Search</button>
              </form>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Role:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '120px' }}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="All">All Roles</option>
                    <option value="citizen">Citizen</option>
                    <option value="staff">Staff Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status:</span>
                  <select
                    className="form-control"
                    style={{ height: '38px', width: '120px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Master Table */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading user register...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Users size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                  No User Accounts Found
                </h3>
              </div>
            ) : (
              <div className="gov-table-wrapper" style={{ border: 'none' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Full Name & Email</th>
                      <th>National ID</th>
                      <th>Mobile Phone</th>
                      <th>Role & Department</th>
                      <th>County</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>
                            {u.full_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {u.email}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {u.national_id}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {u.phone}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '3px',
                              backgroundColor: u.role === 'admin' ? '#fef2f2' : u.role === 'staff' ? '#ecfdf5' : '#eff6ff',
                              color: u.role === 'admin' ? '#991b1b' : u.role === 'staff' ? '#065f46' : '#1d4ed8',
                              border: `1px solid ${u.role === 'admin' ? '#fecaca' : u.role === 'staff' ? '#a7f3d0' : '#bfdbfe'}`
                            }}
                          >
                            {u.role}
                          </span>
                          {u.department && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {u.department}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: '#334155' }}>
                          {u.county}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '3px',
                              backgroundColor: u.status === 'active' ? '#ecfdf5' : '#fef2f2',
                              color: u.status === 'active' ? '#065f46' : '#991b1b',
                              border: `1px solid ${u.status === 'active' ? '#a7f3d0' : '#fecaca'}`
                            }}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setEditRoleUser(u);
                                setNewRole(u.role);
                                setNewDepartment(u.department || 'Civil Registration Services');
                              }}
                            >
                              Role
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                type="button"
                                className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => handleToggleStatus(u.id)}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </div>
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

      {/* Edit Role Modal */}
      {editRoleUser && (
        <div className="modal-overlay" onClick={() => setEditRoleUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Change User Role & Department
              </div>
              <button onClick={() => setEditRoleUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                  <div>User: <strong>{editRoleUser.full_name}</strong></div>
                  <div>Email: <strong>{editRoleUser.email}</strong></div>
                  <div>National ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{editRoleUser.national_id}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">System Role <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="staff">Staff Officer (Adjudicator)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                {newRole === 'staff' && (
                  <div className="form-group">
                    <label className="form-label">Assigned Department</label>
                    <select
                      className="form-control"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                    >
                      <option value="Civil Registration Services">Civil Registration Services</option>
                      <option value="Directorate of Immigration">Directorate of Immigration</option>
                      <option value="Directorate of Criminal Investigations (DCI)">Directorate of Criminal Investigations (DCI)</option>
                      <option value="Ministry of Lands & Physical Planning">Ministry of Lands & Physical Planning</option>
                      <option value="Business Registration Service (BRS)">Business Registration Service (BRS)</option>
                      <option value="County Urban Works & Environment">County Urban Works & Environment</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditRoleUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingRole}>
                  {updatingRole ? 'Updating...' : 'Save Role Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Staff Modal */}
      {showCreateStaffModal && (
        <div className="modal-overlay" onClick={() => setShowCreateStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Provision Department Officer Account</div>
              <button onClick={() => setShowCreateStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStaffSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Officer Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Inspector Daniel Kiprop"
                    value={staffForm.full_name}
                    onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">National ID No. <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. 19284012"
                      value={staffForm.national_id}
                      onChange={(e) => setStaffForm({ ...staffForm, national_id: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Mobile Phone <span className="required">*</span></label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="e.g. 0722111222"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="e.g. officer.name@psrs.go.ke"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Government Department <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                  >
                    <option value="Civil Registration Services">Civil Registration Services</option>
                    <option value="Directorate of Immigration">Directorate of Immigration</option>
                    <option value="Directorate of Criminal Investigations (DCI)">Directorate of Criminal Investigations (DCI)</option>
                    <option value="Ministry of Lands & Physical Planning">Ministry of Lands & Physical Planning</option>
                    <option value="Business Registration Service (BRS)">Business Registration Service (BRS)</option>
                    <option value="County Urban Works & Environment">County Urban Works & Environment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="Minimum 6 characters"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateStaffModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingStaff}>
                  {creatingStaff ? 'Provisioning...' : 'Provision Officer Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
