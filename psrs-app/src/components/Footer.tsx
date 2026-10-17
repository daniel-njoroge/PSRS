import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="gov-footer">
    <div className="gov-container">
      <div className="footer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginBottom: 10 }}>PSRS</div>
          <p style={{ lineHeight: 1.6, color: '#cbd5e1', fontSize: 13 }}>
            A demonstration project for reporting neighbourhood service issues and tracking progress.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12 }}>This platform is a project demo and not affiliated with the Kenyan Government. Do not enter real sensitive personal information.</p>
        </div>
        <div>
          <div className="footer-heading">Get started</div>
          <ul className="footer-links">
            <li><Link to="/requests">Explore local services</Link></li>
            <li><Link to="/register">Create a citizen account</Link></li>
            <li><Link to="/track">Track a request</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">PSRS · Local service request demo</div>
    </div>
  </footer>
);
