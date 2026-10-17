import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Announcement } from '../../types';
import {
  Bell,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    priority: 'normal' as 'normal' | 'important' | 'urgent',
  });
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; announcements: Announcement[] }>('/notifications/announcements');
      if (res.success) {
        setAnnouncements(res.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPublishing(true);
      const res = await api.post<{ success: boolean; message: string }>('/notifications/announcements', form);
      if (res.success) {
        setShowModal(false);
        setForm({ title: '', summary: '', content: '', priority: 'normal' });
        await fetchAnnouncements();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement.');
    } finally {
      setPublishing(false);
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
          <span>Gazette & Announcements</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Public Gazette Notices & Portal Announcements
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
              Broadcast official advisories, holiday processing schedules, and public notices to all citizens.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            <PlusCircle size={15} />
            <span>Publish New Notice</span>
          </button>
        </div>

        {/* Announcements List */}
        <div className="gov-card">
          <div className="gov-card-body" style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Loading gazette notices...
              </div>
            ) : announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No active announcements published.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      border: '1px solid var(--gov-slate-200)',
                      borderRadius: '4px',
                      padding: '20px',
                      backgroundColor: ann.priority === 'urgent' ? '#fef2f2' : ann.priority === 'important' ? '#fffbeb' : '#fff',
                      borderLeft: `4px solid ${ann.priority === 'urgent' ? '#dc2626' : ann.priority === 'important' ? '#d97706' : '#006644'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          backgroundColor: ann.priority === 'urgent' ? '#dc2626' : ann.priority === 'important' ? '#d97706' : '#006644',
                          color: '#fff'
                        }}
                      >
                        {ann.priority} Notice
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Published on {new Date(ann.created_at).toLocaleDateString('en-KE')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '6px' }}>
                      {ann.title}
                    </h3>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      {ann.summary}
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Publish Gazette Notice</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePublish}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Notice Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Gazetted Public Holiday Processing Schedule"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Broadcast Priority</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  >
                    <option value="normal">Normal Announcement</option>
                    <option value="important">Important Advisory</option>
                    <option value="urgent">Urgent Gazette Notice</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Summary Banner Teaser <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Brief 1-sentence synopsis for the top ticker..."
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Notice Content <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    rows={4}
                    required
                    placeholder="Full statutory statement or procedural announcement..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={publishing}>
                  {publishing ? 'Publishing...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
