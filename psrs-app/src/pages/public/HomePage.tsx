import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Service, Announcement } from '../../types';
import {
  Search,
  FileCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  Building2,
  Compass,
  AlertCircle,
  Fingerprint,
  FileBadge,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackRef, setTrackRef] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [svcRes, annRes] = await Promise.all([
          api.get<{ success: boolean; services: Service[] }>('/services'),
          api.get<{ success: boolean; announcements: Announcement[] }>('/notifications/announcements'),
        ]);

        if (svcRes.success) setServices(svcRes.services || []);
        if (annRes.success) setAnnouncements(annRes.announcements || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackRef.trim()) {
      navigate(`/track?ref=${encodeURIComponent(trackRef.trim().toUpperCase())}`);
    }
  };

  const categories = [
    {
      name: 'Civil Registration',
      icon: <FileBadge size={26} color="#006644" />,
      desc: 'Official birth certificate applications and certified death certificate registration folios.',
    },
    {
      name: 'Identity & Immigration',
      icon: <Fingerprint size={26} color="#006644" />,
      desc: 'Maiden Kenyan National Identity Card issuance and ordinary biometric passport renewals.',
    },
    {
      name: 'Police Services',
      icon: <ShieldCheck size={26} color="#006644" />,
      desc: 'DCI forensic criminal clearance screening and Certificate of Good Conduct applications.',
    },
  ];

  return (
    <div>
      {/* Institutional Hero Banner */}
      <section style={{ backgroundColor: '#0a2540', color: '#fff', padding: '48px 0 56px 0', borderBottom: '4px solid #006644' }}>
        <div className="gov-container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: '14px' }}>
              Access Kenyan Public Services Quickly and Transparently
            </h1>
            <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '28px' }}>
              Discover statutory services, lodge verified digital applications, upload required documentation, remit fees securely, and track your request milestones in real time.
            </p>

            {/* Service Search Bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '640px', margin: '0 auto 24px auto' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '42px', height: '48px', fontSize: '15px' }}
                  placeholder="Search services: e.g. Birth Certificate, Passport, Good Conduct, Land Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: '48px' }}>
                Search Directory
              </button>
            </form>

            {/* Quick Track Input Bar */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '14px 20px', maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ textAlign: 'left', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Have an existing reference number?</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Check status without signing in</div>
              </div>
              <form onSubmit={handleTrack} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. PSRS-2026-CRB-90214"
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'var(--font-mono)' }}
                />
                <button type="submit" className="btn btn-outline btn-sm" style={{ background: '#fff', color: '#0f172a', fontWeight: 700 }}>
                  Track
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section style={{ padding: '44px 0' }}>
        <div className="gov-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
                Government Service Sectors
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '3px' }}>
                Browse verified public service categories coordinated under national and county departments.
              </p>
            </div>
            <Link to="/services" className="btn btn-outline btn-sm">
              <span>View All Services</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {categories.map((cat) => {
              const count = services.filter((s) => s.category === cat.name).length;
              return (
                <Link
                  key={cat.name}
                  to={`/services?cat=${encodeURIComponent(cat.name)}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    backgroundColor: '#fff',
                    border: '1px solid var(--gov-slate-200)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '20px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#006644')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--gov-slate-200)')}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>{cat.name}</h3>
                      <span style={{ fontSize: '12px', background: 'var(--gov-slate-100)', color: '#475569', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                        {count} {count === 1 ? 'Service' : 'Services'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{cat.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Public Services Table */}
      <section style={{ padding: '20px 0 44px 0' }}>
        <div className="gov-container">
          <div style={{ marginBottom: '20px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              Frequently Requested Services
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '3px' }}>
              Standard turnaround times, fees in Kenyan Shillings (KES), and direct application access.
            </p>
          </div>

          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Public Service</th>
                  <th>Category</th>
                  <th>Responsible Department</th>
                  <th>Statutory Fee</th>
                  <th>Standard SLA</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {services.slice(0, 6).map((svc) => (
                  <tr key={svc.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--gov-navy-900)' }}>{svc.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {svc.description.slice(0, 80)}...
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '3px', fontWeight: 600 }}>
                        {svc.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#475569' }}>{svc.department}</td>
                    <td style={{ fontWeight: 700, color: svc.fee_kes === 0 ? '#006644' : '#0f172a' }}>
                      {svc.fee_kes === 0 ? 'Complimentary' : `KES ${svc.fee_kes.toLocaleString()}`}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                        <Clock size={13} color="#64748b" />
                        <span>{svc.processing_time_days} {svc.processing_time_days === 1 ? 'Working Day' : 'Working Days'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link to={`/services/${svc.slug || svc.id}`} className="btn btn-outline btn-sm">
                          Details
                        </Link>
                        <Link to={`/citizen/apply/${svc.id}`} className="btn btn-primary btn-sm">
                          Apply Now
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Institutional Workflow Steps */}
      <section style={{ backgroundColor: '#fff', borderTop: '1px solid var(--gov-slate-200)', borderBottom: '1px solid var(--gov-slate-200)', padding: '48px 0' }}>
        <div className="gov-container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
              How Public Service Requests Are Processed
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
              A four-step digital workflow governed under the Public Service Commission standards.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div style={{ border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '22px', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#0a2540', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '14px' }}>
                1
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                Select Service & Verify Eligibility
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Identify the required government department, review mandatory requirements, statutory fees, and gather required scans.
              </p>
            </div>

            <div style={{ border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '22px', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#0a2540', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '14px' }}>
                2
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                Lodge Digital Application
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Fill out the dynamic statutory form, upload PDF/JPEG verification documents, and review your declaration.
              </p>
            </div>

            <div style={{ border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '22px', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#006644', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '14px' }}>
                3
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                Remit Statutory Fee
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Execute the fee transaction via mobile money or card sandbox. Receive an electronic government treasury receipt immediately.
              </p>
            </div>

            <div style={{ border: '1px solid var(--gov-slate-200)', borderRadius: '4px', padding: '22px', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#006644', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '14px' }}>
                4
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                Track & Receive Milestone Updates
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Department officers review submissions, request corrections if needed, and issue certified digital documents upon approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Announcements Bar */}
      {announcements.length > 0 && (
        <section style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 0' }}>
          <div className="gov-container" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '3px', textTransform: 'uppercase' }}>
              Official Notice
            </span>
            <div style={{ fontSize: '13px', color: '#78350f', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>{announcements[0].title}:</strong> {announcements[0].summary}
            </div>
            <Link to="" style={{ fontSize: '12px', color: '#92400e', fontWeight: 700, textDecoration: 'underline' }}>
              View Details
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
