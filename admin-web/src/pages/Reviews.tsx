import React, { useEffect, useState } from 'react';
import { StarIcon } from '../components/ui/Icons';
import { getReports, updateReportStatus } from '../services/reportService';
import type { Report, ReportStatus, Rating, User } from '../types';

export const Reviews: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const statusQuery = activeTab !== 'all' ? activeTab : undefined;

    getReports(statusQuery)
      .then((res) => {
        if (isMounted && res?.reports) {
          setReports(res.reports);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not retrieve moderation queue.');
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
  }, [activeTab, refreshTrigger]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          Reviews & Moderation
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Review reported feedback, resolve customer flags, and maintain platform standards.
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
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
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: 16,
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'var(--primary-text)' : 'var(--text-main)',
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

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.85rem 1.25rem', borderRadius: 14 }}>
          {error}
        </div>
      )}

      {/* Queue Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 20,
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading reports...</div>}

        {!loading && reports.length === 0 && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reported reviews in this category.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reports.map((report) => {
            const customer = typeof report.customerId === 'object' ? (report.customerId as User) : null;
            const ratingObj = typeof report.ratingId === 'object' ? (report.ratingId as Rating) : null;
            const isProcessing = actionLoading === report._id;

            return (
              <div
                key={report._id}
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
                              : 'var(--text-main)',
                          border: '1px solid var(--border-main)',
                        }}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Reported Reason: <strong style={{ color: 'var(--text-main)' }}>{report.reason}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {report.status !== 'reviewed' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(report._id, 'reviewed')}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: 10,
                          border: '1px solid var(--border-main)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
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
                          padding: '0.4rem 0.85rem',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--primary)',
                          color: 'var(--primary-text)',
                          fontSize: '0.85rem',
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
                          padding: '0.4rem 0.85rem',
                          borderRadius: 10,
                          border: '1px solid var(--border-main)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating details attached */}
                {ratingObj && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 12,
                      padding: '1rem',
                      border: '1px solid var(--border-main)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', color: 'var(--star-gold)' }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} size={15} filled={i < ratingObj.rating} />
                        ))}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ratingObj.rating}/5</span>
                    </div>
                    {ratingObj.comment && (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                        "{ratingObj.comment}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
