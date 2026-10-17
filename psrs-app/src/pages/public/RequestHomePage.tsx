import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Droplets, Trash2, CloudRain, Trees, Building2, Search, ArrowRight, type LucideIcon } from 'lucide-react';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_DESCRIPTIONS, type RequestCategory } from '../../types';

const categoryIcons: Record<RequestCategory, LucideIcon> = {
  'Roads & Lighting': Lightbulb,
  'Water Services': Droplets,
  'Waste Management': Trash2,
  'Drainage & Flooding': CloudRain,
  'Public Spaces & Parks': Trees,
  'Public Facilities': Building2
};

export const RequestHomePage: React.FC = () => (
  <div>
    <section className="hero-section" style={{ background: '#0a2540', color: '#fff', padding: '64px 0' }}>
      <div className="gov-container" style={{ maxWidth: 900, textAlign: 'center' }}>
        <p style={{ color: '#86efac', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Public Service Request System</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.15, margin: '12px 0' }}>Request a local service</h1>
        <p style={{ color: '#cbd5e1', fontSize: 17, maxWidth: 700, margin: '0 auto 26px' }}>Ask for help with local services in your neighbourhood and follow your request from Pending to Resolved.</p>
        <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/requests" className="btn btn-primary">Explore local services <ArrowRight size={16} /></Link>
          <Link to="/track" className="btn btn-outline-light"><Search size={16} /> Track a request</Link>
        </div>
      </div>
    </section>
    <section className="gov-container" style={{ padding: '44px 20px 60px' }}>
      <h2 style={{ color: 'var(--gov-navy-900)', fontSize: 24, fontWeight: 800 }}>Local services you can request</h2>
      <p style={{ color: '#64748b', marginBottom: 22 }}>Choose a service to start a request.</p>
      <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18 }}>
        {REQUEST_CATEGORIES.map((category) => {
          const Icon = categoryIcons[category];
          return <article className="gov-card" key={category} style={{ padding: 22 }}>
            <Icon size={28} color="#006644" /><h3 style={{ color: 'var(--gov-navy-900)', margin: '12px 0 6px' }}>{category}</h3>
            <p style={{ color: '#64748b', minHeight: 42 }}>{REQUEST_CATEGORY_DESCRIPTIONS[category]}</p>
            <Link to={`/citizen/requests/new?category=${encodeURIComponent(category)}`} className="text-link" style={{ marginTop: 12 }}>Request this service <ArrowRight size={14} /></Link>
          </article>;
        })}
      </div>
    </section>
  </div>
);
