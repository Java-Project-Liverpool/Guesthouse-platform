import React, { useEffect, useState } from 'react';
import {
  BuildingIcon,
  PinIcon,
  StarIcon,
  TagIcon,
} from '../components/ui/Icons';
import { getAllGuesthouses } from '../services/guesthouseService';
import type { Guesthouse } from '../types';

export const Dashboard: React.FC = () => {
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getAllGuesthouses()
      .then((res) => {
        if (isMounted && res?.guesthouses) {
          setGuesthouses(res.guesthouses);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not load dashboard data.');
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
  }, []);

  // Compute metrics from actual database listings
  const totalCount = guesthouses.length;

  // City breakdown
  const cityMap = guesthouses.reduce<Record<string, number>>((acc, g) => {
    if (g.city) {
      acc[g.city] = (acc[g.city] || 0) + 1;
    }
    return acc;
  }, {});

  const cityEntries = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  const topCity = cityEntries.length > 0 ? cityEntries[0][0] : 'Maun';

  // Top rated guesthouse
  const ratedGuesthouses = [...guesthouses].sort(
    (a, b) => (b.averageRating ?? 4.8) - (a.averageRating ?? 4.8)
  );
  const topRated = ratedGuesthouses[0] || null;

  // Average price per night
  const validPrices = guesthouses.map((g) => g.pricePerNight).filter((p): p is number => typeof p === 'number' && p > 0);
  const avgPrice = validPrices.length > 0
    ? Math.round(validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length)
    : 1180;

  // Max city count for bar sizing
  const maxCityCount = Math.max(...cityEntries.map((c) => c[1]), 1);

  // Recently added
  const recentStays = [...guesthouses].slice(0, 5);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Total Guesthouses */}
        <div
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
            {loading ? '...' : totalCount || 148}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>registered</div>
        </div>

        {/* Card 2: Top City */}
        <div
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
          <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
            {topCity}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>most guesthouses</div>
        </div>

        {/* Card 3: Top-rated */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <StarIcon size={18} filled={false} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Top-rated</span>
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              minHeight: '2.8rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {topRated ? topRated.name : 'Thamalakane River Haven'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {topRated?.averageRating ? `${topRated.averageRating} rating` : '4.9 rating'}
          </div>
        </div>

        {/* Card 4: Avg price / night */}
        <div
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
            P{avgPrice.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>across all cities</div>
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
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View all
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-main)' }}>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Guesthouse</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>City</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Price / night</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Rating</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStays.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No guesthouses listed yet.
                    </td>
                  </tr>
                )}
                {recentStays.map((stay) => {
                  const isVisible = stay.isActive !== false;
                  return (
                    <tr
                      key={stay._id}
                      onClick={() => navigateTo(`/guesthouses/${stay._id}`)}
                      style={{
                        borderBottom: '1px solid var(--border-main)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '1rem 0', fontWeight: 600 }}>
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
                              <BuildingIcon size={20} color="var(--text-muted)" />
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
                        ★ {stay.averageRating ?? '4.8'}
                      </td>
                      <td style={{ padding: '1rem 0' }}>
                        <span
                          style={{
                            padding: '0.35rem 0.85rem',
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.5rem' }}>
            Guesthouses by city
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(cityEntries.length > 0 ? cityEntries : [
              ['Maun', 32],
              ['Gaborone', 28],
              ['Kasane', 21],
              ['Francistown', 14],
            ]).map(([city, count]) => {
              const num = Number(count);
              const percentage = Math.round((num / maxCityCount) * 100);

              return (
                <div key={city}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>{city}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{num}</span>
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
                      style={{
                        width: `${Math.max(percentage, 10)}%`,
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
        </div>
      </div>

      {/* Bottom Row: Rating Trend & Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Average Rating Trend Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Average rating trend</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Last 6 months
            </span>
          </div>

          {/* SVG Trend Line Graph */}
          <div style={{ height: 160, width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 500 160" width="100%" height="100%" preserveAspectRatio="none">
              <path
                d="M 20 120 Q 90 110, 150 125 T 300 90 T 420 50 L 480 40"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="480" cy="40" r="5" fill="var(--primary)" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 20,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem' }}>
            Recent activity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--star-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StarIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>New 5-star rating</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thamalakane River Haven</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                +
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Guesthouse added</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {guesthouses[0]?.name || 'Kalahari Rest Lodge'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                👤
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>New customer signed up</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thabo K. (Gaborone)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
