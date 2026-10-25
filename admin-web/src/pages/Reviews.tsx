import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { StarIcon, ReviewsIcon } from '../components/ui/Icons';
import {
  deleteRating,
  getAllRatings,
  getReports,
  updateReportStatus,
} from '../services/reportService';
import type { Guesthouse, Rating, Report, ReportStatus, User } from '../types';

export const Reviews: React.FC = () => {
  const [viewMode, setViewMode] = useState<'ratings' | 'reports'>('ratings');

  // Ratings state
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<ReportStatus | 'all'>('all');

  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset the loading flag when the request inputs change. The state is
  // adjusted during render so the effects below never set state synchronously.
  const ratingsKey = `${viewMode}|${refreshTrigger}`;
  const [lastRatingsKey, setLastRatingsKey] = useState(ratingsKey);
  if (ratingsKey !== lastRatingsKey) {
    setLastRatingsKey(ratingsKey);
    if (viewMode === 'ratings') {
      setRatingsLoading(true);
      setError('');
    }
  }

  const reportsKey = `${viewMode}|${activeReportTab}|${refreshTrigger}`;
  const [lastReportsKey, setLastReportsKey] = useState(reportsKey);
  if (reportsKey !== lastReportsKey) {
    setLastReportsKey(reportsKey);
    if (viewMode === 'reports') {
      setReportsLoading(true);
      setError('');
    }
  }

  // Fetch all ratings
  useEffect(() => {
    let isMounted = true;
    if (viewMode === 'ratings') {
      getAllRatings()
        .then((res) => {
          if (isMounted && res?.ratings) {
            setRatings(res.ratings);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Could not retrieve platform ratings.');
          }
        })
        .finally(() => {
          if (isMounted) setRatingsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [viewMode, refreshTrigger]);

  // Fetch reports
  useEffect(() => {
    let isMounted = true;
    if (viewMode === 'reports') {
      const statusQuery = activeReportTab !== 'all' ? activeReportTab : undefined;
      getReports(statusQuery)
        .then((res) => {
          if (isMounted && res?.reports) {
            setReports(res.reports);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Could not retrieve moderation reports.');
          }
        })
        .finally(() => {
          if (isMounted) setReportsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [viewMode, activeReportTab, refreshTrigger]);

  // GSAP animation
  useEffect(() => {
    const listLen = viewMode === 'ratings' ? ratings.length : reports.length;
    const isLoading = viewMode === 'ratings' ? ratingsLoading : reportsLoading;
    if (isLoading || listLen === 0 || !containerRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.review-card-item',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [viewMode, ratings, reports, ratingsLoading, reportsLoading]);

  const handleDeleteRating = async (ratingId: string) => {
    if (!window.confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
      return;
    }

    setActionLoading(ratingId);
    try {
      await deleteRating(ratingId);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete rating.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (reportId: string, nextStatus: ReportStatus) => {
    setActionLoading(reportId);
    try {
      await updateReportStatus(reportId, nextStatus);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          Reviews & Moderation
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Review real traveller feedback, manage comments, and resolve customer flags.
        </div>
      </div>

      {/* Top View Selector: All Reviews vs Reported Queue */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setViewMode('ratings')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 16,
            border: 'none',
            background: viewMode === 'ratings' ? 'var(--primary)' : 'var(--bg-card)',
            color: viewMode === 'ratings' ? 'var(--primary-text)' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: viewMode === 'ratings' ? 'var(--primary)' : 'var(--border-main)',
            transition: 'all 0.15s ease',
          }}
        >
          All traveller reviews ({ratings.length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('reports')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 16,
            border: 'none',
            background: viewMode === 'reports' ? 'var(--primary)' : 'var(--bg-card)',
            color: viewMode === 'reports' ? 'var(--primary-text)' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: viewMode === 'reports' ? 'var(--primary)' : 'var(--border-main)',
            transition: 'all 0.15s ease',
          }}
        >
          Reported flags queue ({reports.length})
        </button>
      </div>

      {/* Report Status Filter Tabs (Shown only when in reports mode) */}
      {viewMode === 'reports' && (
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'var(--bg-card-subtle)',
            borderRadius: 20,
            padding: '0.35rem',
            width: 'fit-content',
            border: '1px solid var(--border-main)',
          }}
        >
          {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveReportTab(tab)}
              style={{
                padding: '0.45rem 1.15rem',
                borderRadius: 16,
                border: 'none',
                background: activeReportTab === tab ? 'var(--primary)' : 'transparent',
                color: activeReportTab === tab ? 'var(--primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.85rem 1.25rem', borderRadius: 14 }}>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 20,
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* VIEW 1: All Ratings */}
        {viewMode === 'ratings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
                <ReviewsIcon size={18} />
                <span>Customer Ratings & Comments</span>
              </div>
              <button
                type="button"
                onClick={() => setRefreshTrigger((p) => p + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {ratingsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading reviews from database...
              </div>
            ) : ratings.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer ratings found in the database.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {ratings.map((rating) => {
                  const customer = typeof rating.customerId === 'object' ? (rating.customerId as User) : null;
                  const guesthouse = typeof rating.guesthouseId === 'object' ? (rating.guesthouseId as Guesthouse) : null;
                  const isProcessing = actionLoading === rating._id;

                  return (
                    <div
                      key={rating._id}
                      className="review-card-item"
                      style={{
                        border: '1px solid var(--border-main)',
                        borderRadius: 16,
                        padding: '1.25rem 1.5rem',
                        background: 'var(--bg-card-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                              {guesthouse?.name || 'Guesthouse'}
                            </span>
                            {guesthouse?.city && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                ({guesthouse.city})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            by <strong>{customer?.name || 'Traveller'}</strong> ({customer?.email || 'email hidden'}) &bull; {formatDate(rating.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: 'var(--star-gold)',
                              fontWeight: 800,
                              fontSize: '1.1rem',
                            }}
                          >
                            <StarIcon size={18} filled />
                            <span>{rating.rating}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRating(rating._id)}
                            disabled={isProcessing}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: 10,
                              border: '1px solid var(--danger)',
                              background: 'transparent',
                              color: 'var(--danger)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              opacity: isProcessing ? 0.6 : 1,
                            }}
                          >
                            {isProcessing ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {rating.comment && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            padding: '0.85rem 1rem',
                            borderRadius: 12,
                            fontSize: '0.9rem',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-main)',
                            fontStyle: 'italic',
                          }}
                        >
                          "{rating.comment}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Reported Queue */}
        {viewMode === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Reported Content Queue
              </div>
              <button
                type="button"
                onClick={() => setRefreshTrigger((p) => p + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {reportsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading reported flags...
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No reported reviews in this category.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {reports.map((report) => {
                  const customer = typeof report.customerId === 'object' ? (report.customerId as User) : null;
                  const ratingObj = typeof report.ratingId === 'object' ? (report.ratingId as Rating) : null;
                  const isProcessing = actionLoading === report._id;

                  return (
                    <div
                      key={report._id}
                      className="review-card-item"
                      style={{
                        border: '1px solid var(--border-main)',
                        borderRadius: 16,
                        padding: '1.25rem 1.5rem',
                        background: 'var(--bg-card-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                              Report from {customer?.name || 'Customer'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              ({customer?.email || 'email hidden'})
                            </span>
                            <span
                              style={{
                                padding: '0.2rem 0.65rem',
                                borderRadius: 20,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background:
                                  report.status === 'pending'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : report.status === 'resolved'
                                    ? 'var(--accent-mint)'
                                    : 'var(--bg-card)',
                                color:
                                  report.status === 'pending'
                                    ? 'var(--star-gold)'
                                    : report.status === 'resolved'
                                    ? 'var(--accent-mint-text)'
                                    : 'var(--text-muted)',
                              }}
                            >
                              {report.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Filed on {formatDate(report.createdAt)}
                          </div>
                        </div>

                        {/* Status Actions */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {report.status === 'pending' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(report._id, 'reviewed')}
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: 10,
                                border: '1px solid var(--border-main)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {report.status !== 'resolved' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(report._id, 'resolved')}
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: 10,
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'var(--primary-text)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Resolve
                            </button>
                          )}
                          {report.status !== 'dismissed' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(report._id, 'dismissed')}
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: 10,
                                border: '1px solid var(--border-main)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Flag Reason */}
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.05)',
                          borderLeft: '3px solid var(--danger)',
                          padding: '0.65rem 1rem',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '0.85rem',
                        }}
                      >
                        <strong>Reason:</strong> {report.reason}
                      </div>

                      {/* Associated Rating Details */}
                      {ratingObj && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-main)',
                            borderRadius: 12,
                            padding: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--star-gold)', fontWeight: 700, marginBottom: '0.35rem' }}>
                            <StarIcon size={16} filled />
                            <span>{ratingObj.rating} Stars</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                            "{ratingObj.comment || 'No comment text provided'}"
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
