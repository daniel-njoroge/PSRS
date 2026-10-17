import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { Service } from '../../types';
import { Search, Filter, Clock, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ServicesDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get('cat') || 'All';
  const currentQuery = searchParams.get('q') || '';
  const currentFeeFilter = searchParams.get('fee') || 'All';

  const [searchInput, setSearchInput] = useState(currentQuery);

  const categories = [
    'All',
    'Civil Registration',
    'Identity & Immigration',
    'Police Services',
  ];

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; services: Service[] }>('/services');
        if (res.success) {
          setServices(res.services || []);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const updateFilters = (newCat?: string, newQ?: string, newFee?: string) => {
    const params = new URLSearchParams(searchParams);
    if (newCat !== undefined) {
      if (newCat === 'All') params.delete('cat');
      else params.set('cat', newCat);
    }
    if (newQ !== undefined) {
      if (!newQ.trim()) params.delete('q');
      else params.set('q', newQ.trim());
    }
    if (newFee !== undefined) {
      if (newFee === 'All') params.delete('fee');
      else params.set('fee', newFee);
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, searchInput, undefined);
  };

  // Filter client-side
  const filteredServices = services.filter((svc) => {
    const matchesCat = currentCategory === 'All' || svc.category === currentCategory;
    const matchesQuery =
      !currentQuery ||
      svc.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
      svc.description.toLowerCase().includes(currentQuery.toLowerCase()) ||
      svc.department.toLowerCase().includes(currentQuery.toLowerCase());
    const matchesFee =
      currentFeeFilter === 'All' ||
      (currentFeeFilter === 'free' && svc.fee_kes === 0) ||
      (currentFeeFilter === 'paid' && svc.fee_kes > 0);
    return matchesCat && matchesQuery && matchesFee;
  });

  return (
    <div style={{ padding: '32px 0 60px 0' }}>
      <div className="gov-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Public Services Directory</span>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '28px', borderBottom: '2px solid var(--gov-slate-200)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>
            Official Public Services Directory
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Comprehensive catalog of digitized government applications, legal requirements, and standard SLAs.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="gov-card" style={{ marginBottom: '28px' }}>
          <div className="gov-card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '14px', alignItems: 'center' }}>
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Search by service name, department, or keywords..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-navy">
                  Search
                </button>
              </form>

              {/* Fee filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Fee:</span>
                <select
                  className="form-control"
                  style={{ width: '130px' }}
                  value={currentFeeFilter}
                  onChange={(e) => updateFilters(undefined, undefined, e.target.value)}
                >
                  <option value="All">All Fees</option>
                  <option value="free">Complimentary</option>
                  <option value="paid">Statutory Paid</option>
                </select>
              </div>

              {/* Reset button */}
              {(currentCategory !== 'All' || currentQuery || currentFeeFilter !== 'All') && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '16px', borderTop: '1px solid var(--gov-slate-200)', paddingTop: '14px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateFilters(cat, undefined, undefined)}
                  className={`btn btn-sm ${currentCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services List / Table */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            Loading public services directory...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="gov-card" style={{ padding: '48px', textAlign: 'center' }}>
            <Search size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gov-navy-900)' }}>
              No Public Services Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', maxWidth: '440px', margin: '4px auto 16px auto' }}>
              We could not find any services matching your search or filter parameters. Try checking your spelling or clearing filters.
            </p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
            </div>

            {filteredServices.map((svc) => (
              <div key={svc.id} className="gov-card" style={{ borderLeft: '4px solid #006644' }}>
                <div className="gov-card-body" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          {svc.category}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                          {svc.department}
                        </span>
                      </div>

                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gov-navy-900)', marginBottom: '8px' }}>
                        <Link to={`/services/${svc.slug || svc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {svc.name}
                        </Link>
                      </h2>

                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                        {svc.description}
                      </p>

                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#006644" />
                          <span>Turnaround: <strong>{svc.processing_time_days} {svc.processing_time_days === 1 ? 'Business Day' : 'Business Days'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} color="#006644" />
                          <span>Required Documents: <strong>{svc.required_documents?.length || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: '100px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Statutory Fee</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: svc.fee_kes === 0 ? '#006644' : '#0a2540' }}>
                          {svc.fee_kes === 0 ? 'Complimentary' : `KES ${svc.fee_kes.toLocaleString()}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <Link to={`/services/${svc.slug || svc.id}`} className="btn btn-outline btn-sm">
                          View Requirements
                        </Link>
                        <Link to={`/citizen/apply/${svc.id}`} className="btn btn-primary btn-sm">
                          <span>Apply</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
