import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { KENYA_COUNTIES } from '../../utils/kenyaCounties';
import { User, Lock, ShieldCheck, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [phone, setPhone] = useState(user?.phone || '');
  const [county, setCounty] = useState(user?.county || 'Nairobi');
  const [subCounty, setSubCounty] = useState(user?.sub_county || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const res = await api.put<{ success: boolean; message: string }>('/auth/profile', {
        phone,
        county,
        sub_county: subCounty,
      });

      if (res.success) {
        setProfileSuccess('Profile contact and domicile updated successfully.');
        await refreshUser();
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Password confirmations do not match.');
      return;
    }

    try {
      setChangingPass(true);
      setPassError(null);
      setPassSuccess(null);

      const res = await api.put<{ success: boolean; message: string }>('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPassSuccess('Security password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container" style={{ maxWidth: '820px' }}>
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/citizen/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Profile & Security Settings</span>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '28px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Citizen Account & Security
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
            Manage your verified contact details and portal credentials.
          </p>
        </div>

        {/* 2-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Profile Details */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#006644" />
                <span>Identification & Contact</span>
              </div>
            </div>
            <div className="gov-card-body" style={{ padding: '24px' }}>
              {profileSuccess && (
                <div className="gov-alert gov-alert-success" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={16} />
                  <div style={{ fontSize: '13px' }}>{profileSuccess}</div>
                </div>
              )}

              {profileError && (
                <div className="gov-alert gov-alert-danger" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <div style={{ fontSize: '13px' }}>{profileError}</div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.full_name || ''}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                  <div className="form-hint">Locked to verified National Registration Bureau records.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">National Identity Card No.</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.national_id || ''}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ''}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Mobile Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">County of Domicile <span className="required">*</span></label>
                  <select
                    className="form-control"
                    required
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sub-County / Constituency <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={savingProfile}
                >
                  <Save size={15} />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Password Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="gov-card">
              <div className="gov-card-header">
                <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} color="#006644" />
                  <span>Change Password</span>
                </div>
              </div>
              <div className="gov-card-body" style={{ padding: '24px' }}>
                {passSuccess && (
                  <div className="gov-alert gov-alert-success" style={{ marginBottom: '16px' }}>
                    <CheckCircle2 size={16} />
                    <div style={{ fontSize: '13px' }}>{passSuccess}</div>
                  </div>
                )}

                {passError && (
                  <div className="gov-alert gov-alert-danger" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <div style={{ fontSize: '13px' }}>{passError}</div>
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">Current Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-outline"
                    style={{ width: '100%', marginTop: '8px' }}
                    disabled={changingPass}
                  >
                    <span>{changingPass ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Statutory Account Status Card */}
            <div className="gov-card" style={{ backgroundColor: '#f8fafc' }}>
              <div className="gov-card-body" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#006644', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>Verified Citizen Account</span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  Account status is <strong>ACTIVE</strong> under Kenya National Public Service guidelines. Role: <strong>{user?.role.toUpperCase()}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
