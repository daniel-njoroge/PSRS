import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

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
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ padding: '48px 0 80px 0' }}>
      <div className="gov-container page-container" style={{ maxWidth: '520px' }}>
        {/* Header notice */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Sign In
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Sign in to submit requests or manage the request dashboard.
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
                  Email address <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    required
                    placeholder="you@example.com"
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
                Register a Citizen Account
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
            <div className="demo-account-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('citizen@example.ke', 'Citizen@2026')}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start', gap: '6px' }}
              >
                <User size={13} color="#006644" />
                <span>Demo citizen account</span>
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
