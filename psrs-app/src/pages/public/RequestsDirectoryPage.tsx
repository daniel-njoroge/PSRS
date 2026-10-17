import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Droplets, Trash2, CloudRain, Trees, Building2, ArrowRight, type LucideIcon } from 'lucide-react';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_DESCRIPTIONS, type RequestCategory } from '../../types';

const categoryIcons: Record<RequestCategory, LucideIcon> = {
  'Roads & Lighting': Lightbulb,
  'Water Services': Droplets,
  'Waste Management': Trash2,
  'Drainage & Flooding': CloudRain,
  'Public Spaces & Parks': Trees,
  'Public Facilities': Building2
};

export const RequestsDirectoryPage: React.FC = () => (
  <div className="gov-container page-container" style={{ padding: '40px 0 64px' }}>
    <h1 style={{ color: 'var(--gov-navy-900)', fontSize: 30, fontWeight: 800 }}>Request a local service</h1>
    <p style={{ maxWidth: 680, color: '#64748b', margin: '10px 0 28px' }}>
      Choose a service, tell us where it is needed, and describe what assistance is required. You can add an image to help explain your request.
    </p>
    <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
      {REQUEST_CATEGORIES.map((category) => {
        const Icon = categoryIcons[category];
        return <article className="gov-card" key={category}>
          <div className="gov-card-body" style={{ padding: 24 }}>
            <Icon size={28} color="#006644" />
            <h2 style={{ fontSize: 18, color: 'var(--gov-navy-900)', margin: '14px 0 8px' }}>{category}</h2>
            <p style={{ color: '#64748b', fontSize: 14, minHeight: 42 }}>{REQUEST_CATEGORY_DESCRIPTIONS[category]}</p>
            <Link to={`/citizen/requests/new?category=${encodeURIComponent(category)}`} className="btn btn-primary" style={{ marginTop: 18 }}>
              Request this service <ArrowRight size={15} />
            </Link>
          </div>
        </article>;
      })}
    </div>
    <p style={{ marginTop: 24, color: '#64748b', fontSize: 13 }}>Sign in or create a citizen account to request and manage local services.</p>
  </div>
);
