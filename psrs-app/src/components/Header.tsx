import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NationalEmblem } from './NationalEmblem';
import {
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Layers,
  FileText,
  Search,
  HelpCircle,
  CreditCard,
  Settings,
  ChevronDown,
  Menu,
  X,
  Home
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isCitizen, isStaff, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close all menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifMenu(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="gov-header">
        <div className="gov-container header-main">

          {/* Brand */}
          <Link to="/" className="gov-brand" onClick={closeMobile}>
            <div className="gov-emblem-box" title="Republic of Kenya Public Service">
              <NationalEmblem size={38} />
            </div>
            <div className="gov-title-area">
              <h1>PSR System</h1>
              <p>Project by Daniel Njoroge</p>
            </div>
          </Link>

          {/* Desktop Navigation (hidden on mobile) */}
          <nav className="gov-nav desktop-nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <Home size={14} />
              <span>Home</span>
            </Link>
            <Link to="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`}>
              <Layers size={14} />
              <span>Services</span>
            </Link>
            <Link to="/track" className={`nav-link ${isActive('/track') ? 'active' : ''}`}>
              <Search size={14} />
              <span>Track</span>
            </Link>
            <Link to="/help" className={`nav-link ${isActive('/help') ? 'active' : ''}`}>
              <HelpCircle size={14} />
              <span>Help</span>
            </Link>

            {user && isCitizen && (
              <>
                <Link to="/citizen/dashboard" className={`nav-link ${isActive('/citizen/dashboard') ? 'active' : ''}`}>
                  <UserIcon size={14} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/citizen/applications" className={`nav-link ${isActive('/citizen/applications') ? 'active' : ''}`}>
                  <FileText size={14} />
                  <span>Applications</span>
                </Link>
                <Link to="/citizen/payments" className={`nav-link ${isActive('/citizen/payments') ? 'active' : ''}`}>
                  <CreditCard size={14} />
                  <span>Payments</span>
                </Link>
              </>
            )}

            {user && (isStaff || isAdmin) && (
              <Link
                to="/admin/dashboard"
                className={`nav-link ${isAdminActive ? 'active' : ''}`}
                style={{ background: 'rgba(0, 102, 68, 0.35)', border: '1px solid rgba(0,102,68,0.6)' }}
              >
                <Shield size={14} />
                <span>{isAdmin ? 'Admin' : 'Workbench'}</span>
              </Link>
            )}
          </nav>

          {/* Right actions (desktop) */}
          <div className="header-actions desktop-actions">
            {user ? (
              <>
                {/* Notifications */}
                <div className="header-dropdown-wrap" ref={notifMenuRef}>
                  <button
                    onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); }}
                    className="hdr-icon-btn"
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="hdr-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="hdr-dropdown notif-dropdown">
                      <div className="hdr-dropdown-header">
                        <span>Notifications</span>
                        <span className="hdr-badge-count">{unreadCount} new</span>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="hdr-dropdown-empty">No recent notifications</div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            className={`hdr-notif-item ${n.is_read ? '' : 'hdr-notif-unread'}`}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifMenu(false);
                            }}
                          >
                            <div className="hdr-notif-title">{n.title}</div>
                            <div className="hdr-notif-msg">{n.message}</div>
                            <div className="hdr-notif-time">{new Date(n.created_at).toLocaleString('en-KE')}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="header-dropdown-wrap" ref={userMenuRef}>
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifMenu(false); }}
                    className="hdr-user-btn"
                  >
                    <UserIcon size={15} />
                    <span className="hdr-user-name">{user.full_name.split(' ')[0]}</span>
                    <ChevronDown size={13} />
                  </button>

                  {showUserMenu && (
                    <div className="hdr-dropdown user-dropdown">
                      <div className="hdr-user-info">
                        <div className="hdr-user-full">{user.full_name}</div>
                        <div className="hdr-user-email">{user.email}</div>
                        <span
                          className="hdr-role-badge"
                          style={{
                            backgroundColor:
                              user.role === 'admin' ? '#991b1b' :
                                user.role === 'staff' ? '#006644' : '#1e3a8a'
                          }}
                        >
                          {user.role}{user.department ? ` • ${user.department}` : ''}
                        </span>
                      </div>
                      <div className="hdr-dropdown-items">
                        <Link to="/citizen/profile" className="hdr-dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <Settings size={14} />
                          <span>Profile & Account</span>
                        </Link>
                        {(isStaff || isAdmin) && (
                          <Link to="/admin/dashboard" className="hdr-dropdown-item hdr-dropdown-item-green" onClick={() => setShowUserMenu(false)}>
                            <Shield size={14} />
                            <span>Staff / Admin Console</span>
                          </Link>
                        )}
                        <div className="hdr-dropdown-divider" />
                        <button className="hdr-dropdown-item hdr-dropdown-item-danger" onClick={handleLogout}>
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" className="btn btn-outline btn-sm hdr-btn-outline">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <NationalEmblem size={22} />
            <span>PSR System</span>
          </div>
          <button className="mobile-drawer-close" onClick={closeMobile} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User info strip (authenticated) */}
        {user && (
          <div className="mobile-user-strip">
            <UserIcon size={15} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div className="mobile-user-name">{user.full_name}</div>
              <div className="mobile-user-email">{user.email}</div>
            </div>
            {unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </div>
        )}

        <nav className="mobile-nav-links">
          <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobile}>
            <Home size={16} /> Home
          </Link>
          <Link to="/services" className={`mobile-nav-link ${isActive('/services') ? 'active' : ''}`} onClick={closeMobile}>
            <Layers size={16} /> Services Directory
          </Link>
          <Link to="/track" className={`mobile-nav-link ${isActive('/track') ? 'active' : ''}`} onClick={closeMobile}>
            <Search size={16} /> Track Request
          </Link>
          <Link to="/help" className={`mobile-nav-link ${isActive('/help') ? 'active' : ''}`} onClick={closeMobile}>
            <HelpCircle size={16} /> Help & FAQ
          </Link>

          {user && isCitizen && (
            <>
              <div className="mobile-nav-divider" />
              <Link to="/citizen/dashboard" className={`mobile-nav-link ${isActive('/citizen/dashboard') ? 'active' : ''}`} onClick={closeMobile}>
                <UserIcon size={16} /> Dashboard
              </Link>
              <Link to="/citizen/applications" className={`mobile-nav-link ${isActive('/citizen/applications') ? 'active' : ''}`} onClick={closeMobile}>
                <FileText size={16} /> My Applications
              </Link>
              <Link to="/citizen/payments" className={`mobile-nav-link ${isActive('/citizen/payments') ? 'active' : ''}`} onClick={closeMobile}>
                <CreditCard size={16} /> Payments
              </Link>
              <Link to="/citizen/profile" className={`mobile-nav-link ${isActive('/citizen/profile') ? 'active' : ''}`} onClick={closeMobile}>
                <Settings size={16} /> Profile & Account
              </Link>
            </>
          )}

          {user && (isStaff || isAdmin) && (
            <>
              <div className="mobile-nav-divider" />
              <Link to="/admin/dashboard" className={`mobile-nav-link mobile-nav-admin ${isAdminActive ? 'active' : ''}`} onClick={closeMobile}>
                <Shield size={16} /> {isAdmin ? 'Admin Console' : 'Officer Workbench'}
              </Link>
            </>
          )}

          {!user && (
            <>
              <div className="mobile-nav-divider" />
              <Link to="/login" className="mobile-nav-link" onClick={closeMobile}>
                <UserIcon size={16} /> Sign In
              </Link>
              <Link to="/register" className="mobile-nav-link mobile-nav-register" onClick={closeMobile}>
                Register Account
              </Link>
            </>
          )}
        </nav>

        {/* Sign Out (bottom of drawer, only authenticated) */}
        {user && (
          <div className="mobile-drawer-footer">
            <button className="mobile-nav-link mobile-nav-danger" onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};
