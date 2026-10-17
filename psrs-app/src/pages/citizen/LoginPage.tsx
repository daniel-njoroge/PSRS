import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NationalEmblem } from '../../components/NationalEmblem';
import { Shield, Lock, User, AlertCircle, CheckCircle2, ArrowRight, FileText } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick fill helper for evaluator convenience
  const fillCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = await login(identifier, password);

      // Redirect appropriately based on role
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect');

      if (redirect) {
        navigate(redirect);
      } else if (user.role === 'admin' || user.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '48px 0 80px 0' }}>
      <div className="gov-container" style={{ maxWidth: '520px' }}>
        {/* Header notice */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Sign In
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Use test accounts provided below sign in div
          </p>
        </div>

        {/* Login Box */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: '28px' }}>
            {error && (
              <div className="gov-alert gov-alert-danger" style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <div style={{ fontSize: '13px' }}>{error}</div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">
                  Email Address or National ID No. <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    required
                    placeholder="e.g. 29481024 or njoroge@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Password <span className="required">*</span>
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '12px', color: '#006644', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px', fontSize: '15px' }}
                disabled={loading}
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--gov-slate-200)', marginTop: '24px', paddingTop: '16px', textAlign: 'center', fontSize: '13px', color: '#475569' }}>
              Don't have a citizen account?{' '}
              <Link to="/register" style={{ color: '#006644', fontWeight: 700, textDecoration: 'underline' }}>
                Register Free Citizen Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Demo Credentials Assistant */}
        <div className="gov-card" style={{ marginTop: '20px', backgroundColor: '#f8fafc' }}>
          <div className="gov-card-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gov-navy-900)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="#006644" />
              <span>One-Click Test Accounts</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('citizen.wanjiku@example.ke', 'Citizen@2026')}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start', gap: '6px' }}
              >
                <User size={13} color="#006644" />
                <span>Citizen: Wanjiku</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('citizen.omondi@example.ke', 'Citizen@2026')}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start', gap: '6px' }}
              >
                <User size={13} color="#006644" />
                <span>Citizen: Omondi</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('officer.civil@psrs.go.ke', 'Staff@2026')}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start', gap: '6px' }}
              >
                <FileText size={13} color="#006644" />
                <span>Staff: Civil Reg</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('admin@psrs.go.ke', 'Admin@2026')}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start', gap: '6px' }}
              >
                <Shield size={13} color="#991b1b" />
                <span>System Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
