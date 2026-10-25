import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  BuildingIcon,
  PinIcon,
  StarIcon,
  TagIcon,
  AppUsersIcon,
} from '../components/ui/Icons';
import { getDashboardStats } from '../services/guesthouseService';
import type { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Show the loading state again whenever the dashboard is refreshed. The
  // state is adjusted during render so the fetch effect stays free of
  // synchronous state updates.
  const [lastRefreshKey, setLastRefreshKey] = useState(refreshKey);
  if (refreshKey !== lastRefreshKey) {
    setLastRefreshKey(refreshKey);
    setLoading(true);
    setError('');
  }

  useEffect(() => {
    let isMounted = true;

    getDashboardStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not retrieve dashboard statistics.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // GSAP animation triggered when stats load
  useEffect(() => {
    if (loading || !stats || !containerRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Animate stat cards
      gsap.fromTo(
        '.dashboard-stat-card',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
      );

      // Animate city progress bars
      gsap.fromTo(
        '.dashboard-city-fill',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.8, delay: 0.2, stagger: 0.05, ease: 'power2.out' }
      );

      // Animate rating breakdown bars
      gsap.fromTo(
        '.dashboard-rating-fill',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.8, delay: 0.2, stagger: 0.05, ease: 'power2.out' }
      );

      // Animate table rows
      gsap.fromTo(
        '.dashboard-table-row',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.3, stagger: 0.05, ease: 'power2.out' }
      );

      // Animate activity items
      gsap.fromTo(
        '.dashboard-activity-item',
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, delay: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading, stats]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const formatTimestamp = (iso: string | Date | undefined) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid var(--border-main)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Loading live dashboard data from Dumela Stays backend...</span>
        </div>

        {/* Skeleton Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 20,
                padding: '1.75rem 1.5rem',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.6,
              }}
            >
              <div style={{ width: '40%', height: 16, background: 'var(--bg-card-subtle)', borderRadius: 6 }} />
              <div style={{ width: '70%', height: 36, background: 'var(--bg-card-subtle)', borderRadius: 8 }} />
              <div style={{ width: '30%', height: 14, background: 'var(--bg-card-subtle)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid var(--danger)',
          borderRadius: 20,
          padding: '2rem',
          color: 'var(--text-main)',
          maxWidth: 600,
        }}
      >
        <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.5rem' }}>
          Could not load live dashboard data
        </div>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>{error}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 14,
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-text)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry connection
        </button>
      </div>
    );
  }

  const data = stats || {
    totalGuesthouses: 0,
    totalAllGuesthouses: 0,
    topCity: null,
    topRatedStay: null,
    avgPrice: null,
    cityCounts: [],
    recentlyAdded: [],
    totalCustomers: 0,
    totalAdmins: 0,
    totalRatings: 0,
    overallAvgRating: null,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentActivity: [],
  };

  const maxCityCount = Math.max(...data.cityCounts.map((c) => c.count), 1);
  const totalRatingsCount = data.totalRatings || 1;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Onboarding Empty Banner if 0 guesthouses */}
      {data.totalAllGuesthouses === 0 && (
        <div
          style={{
            background: 'var(--accent-mint)',
            color: 'var(--accent-mint-text)',
            borderRadius: 20,
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Welcome to Dumela Stays Administration
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              No guesthouses are registered in your database yet. Register your first guesthouse to populate platform metrics.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/guesthouses/new')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: 16,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-text)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add first guesthouse
          </button>
        </div>
      )}

      {/* Primary 4 Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Total Guesthouses */}
        <div
          className="dashboard-stat-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <BuildingIcon size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total guesthouses</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
            {data.totalGuesthouses}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {data.totalGuesthouses === 1 ? '1 active listing' : `${data.totalGuesthouses} active listings`}
            {data.totalAllGuesthouses > data.totalGuesthouses && (
              <span> ({data.totalAllGuesthouses - data.totalGuesthouses} hidden)</span>
            )}
          </div>
        </div>

        {/* Card 2: Top City */}
        <div
          className="dashboard-stat-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <PinIcon size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Top city</span>
          </div>
          <div
            style={{
              fontSize: data.topCity ? '2rem' : '1.4rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 0.25rem',
              lineHeight: 1.2,
            }}
          >
            {data.topCity || 'None yet'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {data.topCity ? 'most registered stays' : 'register stays to view'}
          </div>
        </div>

        {/* Card 3: Top-rated */}
        <div
          className="dashboard-stat-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <StarIcon size={18} filled />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Top-rated stay</span>
          </div>
          <div
            style={{
              fontSize: data.topRatedStay ? '1.25rem' : '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              minHeight: '2.5rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {data.topRatedStay ? data.topRatedStay.name : 'No ratings yet'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {data.topRatedStay ? (
              <>
                <span style={{ color: 'var(--star-gold)', fontWeight: 700 }}>★ {data.topRatedStay.rating}</span>
                <span>({data.topRatedStay.city})</span>
              </>
            ) : (
              <span>Customer feedback will appear here</span>
            )}
          </div>
        </div>

        {/* Card 4: Avg price / night */}
        <div
          className="dashboard-stat-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <TagIcon size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avg price / night</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
            {data.avgPrice !== null ? `P${data.avgPrice.toLocaleString()}` : '-'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {data.avgPrice !== null ? 'Botswana Pula across active stays' : 'calculated from database rates'}
          </div>
        </div>
      </div>

      {/* Middle Row: Recently added & Guesthouses by city */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Recently Added Table Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Recently added</h3>
            <button
              type="button"
              onClick={() => navigateTo('/guesthouses')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View all listings &rarr;
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-main)' }}>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Guesthouse</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>City</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Price / night</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentlyAdded.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No guesthouses listed yet. Click "+ Add first guesthouse" to start.
                    </td>
                  </tr>
                )}
                {data.recentlyAdded.map((stay) => {
                  const isVisible = stay.isActive !== false;
                  return (
                    <tr
                      key={stay._id}
                      className="dashboard-table-row"
                      onClick={() => navigateTo(`/guesthouses/${stay._id}`)}
                      style={{
                        borderBottom: '1px solid var(--border-main)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '0.85rem 0', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
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
                              <BuildingIcon size={18} color="var(--text-muted)" />
                            )}
                          </div>
                          <span>{stay.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0', color: 'var(--text-muted)' }}>{stay.city}</td>
                      <td style={{ padding: '0.85rem 0', fontWeight: 600 }}>
                        {stay.pricePerNight ? `P${stay.pricePerNight.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '0.85rem 0' }}>
                        <span
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isVisible ? 'var(--status-visible-bg)' : 'var(--status-hidden-bg)',
                            color: isVisible ? 'var(--status-visible-text)' : 'var(--status-hidden-text)',
                            display: 'inline-block',
                          }}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guesthouses by City Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Guesthouses by city</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {data.cityCounts.length} {data.cityCounts.length === 1 ? 'city' : 'cities'}
            </span>
          </div>

          {data.cityCounts.length === 0 ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No city counts available. Add properties to see geographic distribution.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {data.cityCounts.map(({ city, count }) => {
                const percentage = Math.round((count / maxCityCount) * 100);

                return (
                  <div key={city}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600 }}>{city}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        {count} {count === 1 ? 'stay' : 'stays'}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 10,
                        borderRadius: 999,
                        background: 'var(--bg-card-subtle)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="dashboard-city-fill"
                        style={{
                          width: `${Math.max(percentage, 8)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Rating Distribution & Genuine Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Real Rating Breakdown Card (Replaces fabricated SVG line) */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem' }}>
                Star rating distribution
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Based on actual traveller reviews in database
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--star-gold)' }}>
                ★ {data.overallAvgRating !== null ? data.overallAvgRating : '-'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {data.totalRatings} {data.totalRatings === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          </div>

          {data.totalRatings === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No traveller reviews recorded yet. Ratings from the mobile app will be aggregated here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.ratingBreakdown[star] || 0;
                const pct = Math.round((count / totalRatingsCount) * 100);

                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.85rem' }}>
                    <span style={{ width: 45, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {star} <StarIcon size={13} filled color="var(--star-gold)" />
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 9,
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="dashboard-rating-fill"
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'var(--star-gold)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Activity Card (Replaces fabricated customer events) */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Recent platform activity
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real timestamps</span>
          </div>

          {data.recentActivity.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recent activity recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="dashboard-activity-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem',
                    borderRadius: 14,
                    background: 'var(--bg-card-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--bg-card)',
                      color: item.type === 'review_submitted' ? 'var(--star-gold)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'review_submitted' ? <StarIcon size={16} filled /> : <BuildingIcon size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', flexShrink: 0 }}>
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary Pill Bar: Users Overview */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 16,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AppUsersIcon size={16} />
            <strong style={{ color: 'var(--text-main)' }}>{data.totalCustomers}</strong> registered {data.totalCustomers === 1 ? 'customer' : 'customers'}
          </span>
          <span>&bull;</span>
          <span>
            <strong style={{ color: 'var(--text-main)' }}>{data.totalAdmins}</strong> platform {data.totalAdmins === 1 ? 'administrator' : 'administrators'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigateTo('/app-users')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Manage users &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
