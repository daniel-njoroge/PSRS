import React from 'react';
import { Link } from 'react-router-dom';
import { NationalEmblem } from './NationalEmblem';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="gov-footer">
      <div className="gov-container">
        <div className="footer-grid">
          {/* Col 1: System info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <NationalEmblem size={26} />
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>
                PSRS
              </div>
            </div>
            <p style={{ lineHeight: 1.6, color: '#94a3b8', fontSize: '13px', marginBottom: '14px' }}>
              The Public Service Request System (PSRS) provides a unified digital window for Kenyan citizens to access, apply for, and track public services under the provisions of the Service Delivery Charter.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Not affiliated with the official eCitizen.go.ke portal. Built strictly for demonstration and development evaluation.
              </div>
            </div>
          </div>

          {/* Col 2: Public Services */}
          <div>
            <div className="footer-heading">Services Directory</div>
            <ul className="footer-links">
              <li><Link to="/services?cat=Civil+Registration">Civil Registration</Link></li>
              <li><Link to="/services?cat=Identity+%26+Immigration">Identity & Immigration</Link></li>
              <li><Link to="/services?cat=Police+Services">DCI Police Services</Link></li>
            </ul>
          </div>

          {/* Col 3: Citizen Guidance */}
          <div>
            <div className="footer-heading">Citizen Helpdesk</div>
            <ul className="footer-links">
              <li><Link to="/track">Track Request Milestones</Link></li>
              <li><Link to="/help">Frequently Asked Questions</Link></li>
              <li><Link to="/help#contact">Lodge Support Ticket</Link></li>
              <li><Link to="/help#charter">Service Delivery Charter</Link></li>
              <li><Link to="/help#privacy">Data Protection & Privacy</Link></li>
              <li><Link to="/help#terms">Terms of Public Service</Link></li>
            </ul>
          </div>

          {/* Col 4: Contacts & Assistance */}
          <div>
            <div className="footer-heading">Public Helpdesk</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <MapPin size={16} color="#006644" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Avenue, Square, P.O. Box 00000-00000, Nairobi, Kenya</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Phone size={16} color="#006644" style={{ flexShrink: 0 }} />
                <span>+254 (020) 1111111 / 0700 000 000</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Mail size={16} color="#006644" style={{ flexShrink: 0 }} />
                <span>helpdesk@psrs.go.ke</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <Shield size={16} color="#006644" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Complies with Data Protection Act (2019)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} PSRS. All Rights Reserved. Public Service Commission.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Njoroge's demo sandbox</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
