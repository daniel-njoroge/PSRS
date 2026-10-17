import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NationalEmblem } from '../../components/NationalEmblem';
import { KENYA_COUNTIES } from '../../utils/kenyaCounties';
import { ShieldCheck, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    national_id: '',
    email: '',
    phone: '',
    county: 'Nairobi',
    sub_county: '',
    password: '',
    confirm_password: '',
    agree_charter: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!/^\d{6,10}$/.test(form.national_id.trim())) {
      setError('National ID must be between 6 and 10 digits.');
      return;
    }

    if (!/^(?:\+254|0)[17]\d{8}$/.test(form.phone.trim())) {
      setError('Invalid Kenyan mobile number. Example: 0712345678 or +254712345678');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!form.agree_charter) {
      setError('You must confirm statutory declaration and data privacy terms.');
      return;
    }

    try {
      setLoading(true);
      await register({
        full_name: form.full_name,
        national_id: form.national_id,
        email: form.email,
        phone: form.phone,
        county: form.county,
        sub_county: form.sub_county,
        password: form.password,
      });

      navigate('/citizen/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '48px 0 80px 0' }}>
      <div className="gov-container" style={{ maxWidth: '640px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#0a2540', borderRadius: '4px', marginBottom: '10px', border: '1px solid #334155' }}>
            <NationalEmblem size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Register Citizen Account
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Create an official public service portal profile linked to your National ID
          </p>
        </div>

        {/* Form Card */}
        <div className="gov-card" style={{ borderTop: '4px solid #006644' }}>
          <div className="gov-card-body" style={{ padding: '28px' }}>
            {error && (
              <div className="gov-alert gov-alert-danger" style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <div style={{ fontSize: '13px' }}>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Full Legal Name (as per National ID) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Samuel Njoroge Kamau"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Kenyan National ID No. <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 29481024"
                    value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                  />
                  <div className="form-hint">6 to 10 digits as shown on ID card</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Kenyan Mobile Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    required
                    placeholder="e.g. 0712345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <div className="form-hint">Used for M-Pesa & SMS alerts</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="e.g. citizen@example.ke"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    County of Residence <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Sub-County / Constituency <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Westlands / Starehe"
                    value={form.sub_county}
                    onChange={(e) => setForm({ ...form, sub_county: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Account Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="Repeat password"
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={form.agree_charter}
                    onChange={(e) => setForm({ ...form, agree_charter: e.target.checked })}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I solemnly declare that the identification details supplied are authentic and agree to the Public Service Request System terms and Kenyan Data Protection regulations.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px', fontSize: '15px' }}
                disabled={loading}
              >
                <span>{loading ? 'Registering Citizen Profile...' : 'Complete Citizen Registration'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--gov-slate-200)', marginTop: '24px', paddingTop: '16px', textAlign: 'center', fontSize: '13px', color: '#475569' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#006644', fontWeight: 700, textDecoration: 'underline' }}>
                Sign In Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
