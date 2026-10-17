import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { NationalEmblem } from '../../components/NationalEmblem';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        identifier,
      });

      if (res.success) {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '48px 0 80px 0' }}>
      <div className="gov-container" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#0a2540', borderRadius: '4px', marginBottom: '10px', border: '1px solid #334155' }}>
            <NationalEmblem size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Account Password Recovery
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Enter your registered Email or Kenyan National ID to receive verification credentials
          </p>
        </div>

        <div className="gov-card" style={{ borderTop: '4px solid #006644' }}>
          <div className="gov-card-body" style={{ padding: '28px' }}>
            {successMsg ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <CheckCircle2 size={40} color="#006644" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                  Verification Dispatched
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
                  {successMsg}
                </p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {errorMsg && (
                  <div className="gov-alert gov-alert-danger" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <div style={{ fontSize: '13px' }}>{errorMsg}</div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">
                    Registered Email or National ID Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 29481024 or citizen@example.ke"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <div className="form-hint">
                    Instructions will be dispatched to the verified primary mobile and email on record.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                  disabled={loading}
                >
                  <span>{loading ? 'Verifying Identifier...' : 'Send Recovery Instructions'}</span>
                  <ArrowRight size={16} />
                </button>

                <div style={{ borderTop: '1px solid var(--gov-slate-200)', marginTop: '20px', paddingTop: '14px', textAlign: 'center' }}>
                  <Link to="/login" style={{ fontSize: '13px', color: '#006644', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
