import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('The passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });
      navigate('/citizen/dashboard');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-container page-container" style={{ maxWidth: 560, padding: '44px 0 64px' }}>
      <h1 style={{ color: 'var(--gov-navy-900)', fontSize: 28, fontWeight: 800 }}>Create a citizen account</h1>
      <p style={{ color: '#64748b', margin: '8px 0 22px' }}>Use your account to submit and track service requests.</p>
      <form className="gov-card" onSubmit={submit}>
        <div className="gov-card-body" style={{ display: 'grid', gap: 16, padding: 24 }}>
          {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
          <label><span className="form-label">Name <b aria-hidden="true">*</b></span><input className="form-control" value={form.full_name} maxLength={120} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoComplete="name" required /></label>
          <label><span className="form-label">Email <b aria-hidden="true">*</b></span><input className="form-control" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
          <label><span className="form-label">Phone (optional)</span><input className="form-control" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel" placeholder="0712345678" /></label>
          <label><span className="form-label">Password <b aria-hidden="true">*</b></span><input className="form-control" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength={8} required /></label>
          <label><span className="form-label">Confirm password <b aria-hidden="true">*</b></span><input className="form-control" type="password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} autoComplete="new-password" minLength={8} required /></label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
          <p style={{ margin: 0, textAlign: 'center', fontSize: 14 }}>Already registered? <Link to="/login">Sign in</Link></p>
        </div>
      </form>
    </div>
  );
};
