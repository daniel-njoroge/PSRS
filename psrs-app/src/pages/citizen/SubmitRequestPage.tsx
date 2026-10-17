import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { REQUEST_CATEGORIES, type CitizenRequest, type RequestCategory } from '../../types';

export const SubmitRequestPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = REQUEST_CATEGORIES.find((category) => category === params.get('category')) || '';
  const [category, setCategory] = useState<RequestCategory | ''>(initialCategory);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!category || !location.trim() || !description.trim()) {
      setError('Choose a category and provide the location and description.');
      return;
    }
    const form = new FormData();
    form.append('category', category);
    form.append('location', location.trim());
    form.append('description', description.trim());
    if (image) form.append('image', image);
    try {
      setSubmitting(true);
      const response = await api.post<{ success: boolean; request: CitizenRequest }>('/requests', form);
      navigate(`/citizen/requests/${response.request.id}`, {
        replace: true,
        state: { submittedReference: response.request.reference_number }
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-container page-container" style={{ maxWidth: 800, padding: '36px 0 60px' }}>
      <div className="breadcrumbs"><Link to="/requests">Request categories</Link><span>/</span><span>New request</span></div>
      <h1 style={{ color: 'var(--gov-navy-900)', fontSize: 28, fontWeight: 800 }}>Submit a service request</h1>
      <p style={{ color: '#64748b', margin: '8px 0 22px' }}>Describe one local issue. Fields marked required must be completed.</p>
      <form className="gov-card" onSubmit={submit}>
        <div className="gov-card-body" style={{ padding: 24, display: 'grid', gap: 18 }}>
          {error && <div className="gov-alert gov-alert-danger" role="alert">{error}</div>}
          <label>
            <span className="form-label">Category <b aria-hidden="true">*</b></span>
            <select className="form-control" value={category} onChange={(event) => setCategory(event.target.value as RequestCategory)} required>
              <option value="">Select a category</option>
              {REQUEST_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="form-label">Location <b aria-hidden="true">*</b></span>
            <input className="form-control" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} placeholder="Street, neighbourhood, or nearby landmark" required />
          </label>
          <label>
            <span className="form-label">Description <b aria-hidden="true">*</b></span>
            <textarea className="form-control" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={6} placeholder="Explain what is happening and when you noticed it." required />
            <small style={{ color: '#64748b' }}>{description.length}/3000 characters</small>
          </label>
          <label>
            <span className="form-label">Image (optional)</span>
            <input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            <small style={{ color: '#64748b' }}>JPG, PNG, or WebP; maximum 5 MB.</small>
          </label>
          <div className="form-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link to="/requests" className="btn btn-outline">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};
