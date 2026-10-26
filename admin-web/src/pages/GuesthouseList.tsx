import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  BuildingIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  HideIcon,
  UnhideIcon,
  StarIcon,
} from '../components/ui/Icons';
import { HideGuesthouseModal } from '../components/ui/Modal';
import {
  searchGuesthouses,
  setGuesthouseVisibility,
} from '../services/guesthouseService';
import type { Guesthouse } from '../types';

type CityDropdownProps = {
  value: string;
  options: string[];
  onChange: (val: string) => void;
};

function CustomCityDropdown({ value, options, onChange }: CityDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 160 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.45rem 0.8rem',
          borderRadius: 12,
          border: '1px solid var(--border-main)',
          background: '#FFFFFF',
          color: 'var(--text-main)',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          minWidth: 160,
        }}
      >
        <span>{value}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 5 7 9 11 5"/></svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Select city"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.35rem)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1px solid var(--border-main)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-md)',
            padding: '0.35rem',
            zIndex: 50,
            listStyle: 'none',
            margin: 0,
          }}
        >
          {options.map((opt) => (
            <li key={opt} role="option" aria-selected={opt === value}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.55rem 0.7rem',
                  borderRadius: 10,
                  border: 'none',
                  background: opt === value ? 'var(--primary)' : 'transparent',
                  color: opt === value ? 'var(--primary-text)' : 'var(--text-main)',
                  fontWeight: opt === value ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const GuesthouseList: React.FC = () => {
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All cities');
  const [error, setError] = useState('');

  // Modal state
  const [modalGuesthouse, setModalGuesthouse] = useState<Guesthouse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // The listing is re-queried whenever the search inputs change, so the
  // loading state is reset during render rather than inside the effect.
  const queryKey = `${searchTerm}|${selectedCity}|${refreshTrigger}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setLoading(true);
  }

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(() => {
      searchGuesthouses({
        name: searchTerm.trim() || undefined,
        city: selectedCity !== 'All cities' ? selectedCity : undefined,
        limit: 100,
        includeHidden: true,
      })
        .then((res) => {
          if (isMounted && res?.guesthouses) {
            setGuesthouses(res.guesthouses);
            setTotal(res.total ?? res.guesthouses.length);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Could not retrieve listings.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedCity, refreshTrigger]);

  // GSAP animation for table rows
  useEffect(() => {
    if (loading || guesthouses.length === 0 || !tbodyRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.guesthouse-table-row',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }, tbodyRef);

    return () => ctx.revert();
  }, [loading, guesthouses]);

  // Cities extracted for filter dropdown
  const cities = ['All cities', 'Maun', 'Gaborone', 'Kasane', 'Francistown', 'Okavango Delta'];

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleOpenVisibilityModal = (guesthouse: Guesthouse, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalGuesthouse(guesthouse);
    setModalOpen(true);
  };

  const handleConfirmVisibility = async () => {
    if (!modalGuesthouse) return;
    setActionLoading(true);

    try {
      const newStatus = modalGuesthouse.isActive === false;
      await setGuesthouseVisibility(modalGuesthouse._id, newStatus);
      setModalOpen(false);
      setModalGuesthouse(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            Guesthouses
          </h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {total} registered
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('/guesthouses/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            borderRadius: 24,
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-text)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <PlusIcon size={18} />
          <span>Register guesthouse</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.85rem 1.25rem', borderRadius: 14 }}>
          {error}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 18,
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or city"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '1rem',
            color: 'var(--text-main)',
          }}
        />

        <CustomCityDropdown
          value={selectedCity}
          options={cities}
          onChange={(val) => setSelectedCity(val)}
        />
      </div>

      {/* Table Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 20,
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Guesthouse</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>City</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Price / night</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Rating</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading guesthouses...
                  </td>
                </tr>
              )}

              {!loading && guesthouses.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No guesthouses match your query.
                  </td>
                </tr>
              )}

              {!loading &&
                guesthouses.map((stay) => {
                  const isVisible = stay.isActive !== false;

                  return (
                    <tr
                      key={stay._id}
                      className="guesthouse-table-row"
                      onClick={() => navigateTo(`/guesthouses/${stay._id}`)}
                      style={{
                        borderBottom: '1px solid var(--border-main)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '1rem 0', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: 'var(--bg-card-subtle)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {stay.logo ? (
                              <img
                                src={stay.logo}
                                alt={stay.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <BuildingIcon size={22} color="var(--text-muted)" />
                            )}
                          </div>
                          <span>{stay.name}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{stay.city}</td>

                      <td style={{ padding: '1rem 0', fontWeight: 600 }}>
                        {stay.pricePerNight ? `P${stay.pricePerNight.toLocaleString()}` : '-'}
                      </td>

                      <td style={{ padding: '1rem 0', color: 'var(--star-gold)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <StarIcon size={16} filled={Boolean(stay.averageRating)} />
                          <span>{stay.averageRating ? stay.averageRating.toFixed(1) : '-'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0' }}>
                        <span
                          style={{
                            padding: '0.35rem 0.9rem',
                            borderRadius: 20,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: isVisible ? 'var(--status-visible-bg)' : 'var(--status-hidden-bg)',
                            color: isVisible ? 'var(--status-visible-text)' : 'var(--status-hidden-text)',
                            display: 'inline-block',
                          }}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo(`/guesthouses/${stay._id}/edit`);
                            }}
                            title="Edit listing"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 10,
                              border: '1px solid var(--border-main)',
                              background: 'transparent',
                              color: 'var(--text-main)',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                            }}
                          >
                            <EditIcon size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenVisibilityModal(stay, e)}
                            title={isVisible ? 'Hide guesthouse' : 'Unhide guesthouse'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 10,
                              border: '1px solid var(--border-main)',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                            }}
                          >
                            {isVisible ? <HideIcon size={15} /> : <UnhideIcon size={15} />}
                            <span>{isVisible ? 'Hide' : 'Unhide'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Showing {guesthouses.length} of {total}
        </div>
      </div>

      {/* Hide Confirmation Modal */}
      <HideGuesthouseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmVisibility}
        guesthouseName={modalGuesthouse?.name}
        isCurrentlyActive={modalGuesthouse?.isActive !== false}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default GuesthouseList;
