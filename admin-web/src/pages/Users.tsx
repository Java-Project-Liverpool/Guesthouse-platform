import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SearchIcon, AppUsersIcon } from '../components/ui/Icons';
import { ApiError } from '../services/api';
import { getCustomerUsers, suspendCustomer } from '../services/userService';
import type { User } from '../types';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'local' | 'google'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [suspendingIds, setSuspendingIds] = useState<Set<string>>(() => new Set());
  const [statusError, setStatusError] = useState('');
  const statusRequests = useRef(new Set<string>());

  const tableRef = useRef<HTMLTableSectionElement>(null);

  // The customer list is re-fetched on demand, so the loading state is reset
  // during render instead of synchronously inside the effect.
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(refreshTrigger);
  if (refreshTrigger !== lastRefreshTrigger) {
    setLastRefreshTrigger(refreshTrigger);
    setLoading(true);
    setError('');
  }

  useEffect(() => {
    let isMounted = true;

    getCustomerUsers()
      .then((res) => {
        if (isMounted && res?.users) {
          setUsers(res.users);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not retrieve customer accounts.');
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
  }, [refreshTrigger]);

  // GSAP animation on rows
  useEffect(() => {
    if (loading || users.length === 0 || !tableRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.user-row',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }, tableRef);

    return () => ctx.revert();
  }, [loading, users]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchesProvider =
      providerFilter === 'all' || (u.authProvider || 'local') === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const handleStatusChange = async (userId: string, currentStatus: boolean | undefined) => {
    if (statusRequests.current.has(userId)) return;
    const newStatus = !(currentStatus === false); // if false -> reactivate (true); else suspend (false)
    if (newStatus === false && !window.confirm('Suspend this account? The user will be denied access.')) return;
    statusRequests.current.add(userId);
    setSuspendingIds((current) => new Set(current).add(userId));
    setStatusError('');
    try {
      const result = await suspendCustomer(userId, newStatus);
      setUsers((current) => current.map((user) => user._id === userId ? result.user : user));
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        const messages: Record<number, string> = {
          400: 'The status request was not accepted. Refresh the customer list and try again.',
          401: 'Your admin session has expired. Sign in again to update this account.',
          403: 'Your account is not permitted to change customer status.',
          404: 'This customer account could not be found. Refresh the list and try again.',
          500: 'The server could not save this change. Please try again later.',
          502: 'The server response was incomplete. Refresh the customer list before trying again.',
        };
        const baseMessage = messages[e.status] || 'Could not update customer status.';
        setStatusError(e.requestId ? `${baseMessage} Reference: ${e.requestId}` : baseMessage);
      } else {
        setStatusError('Could not reach the server. Check your connection and try again.');
      }
    } finally {
      statusRequests.current.delete(userId);
      setSuspendingIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          App users
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Real traveller customer accounts registered on the Dumela Stays platform.
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRefreshTrigger((p) => p + 1)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 8,
              border: 'none',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {statusError && (
        <div role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.85rem 1rem', borderRadius: 12 }}>
          {statusError}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 16,
            padding: '0.6rem 1rem',
            width: 320,
            maxWidth: '100%',
          }}
        >
          <SearchIcon size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
        </div>

        {/* Provider Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'var(--bg-card-subtle)',
            borderRadius: 16,
            padding: '0.3rem',
            border: '1px solid var(--border-main)',
          }}
        >
          {(['all', 'local', 'google'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setProviderFilter(tab)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 12,
                border: 'none',
                background: providerFilter === tab ? 'var(--primary)' : 'transparent',
                color: providerFilter === tab ? 'var(--primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'all' ? 'All providers' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Users Card Table */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <AppUsersIcon size={18} />
            <span>Customers ({filteredUsers.length})</span>
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

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading customer accounts from backend...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-main)' }}>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Customer</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Email</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Auth provider</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Joined</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Role</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {searchTerm
                        ? 'No customer accounts match your search filter.'
                        : 'No customer accounts exist in the database yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = user.name
                      ? user.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'CU';

                    return (
                      <tr
                        key={user._id}
                        className="user-row"
                        style={{ borderBottom: '1px solid var(--border-main)' }}
                      >
                        <td style={{ padding: '1rem 0', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'var(--bg-card-subtle)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{user.email}</td>
                        <td style={{ padding: '1rem 0' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: 12,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              background: 'var(--bg-card-subtle)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {user.authProvider || 'local'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <span
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: 20,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'var(--status-active-bg)',
                              color: 'var(--status-active-text)',
                            }}
                          >
                            Customer
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0', fontWeight: 600, color: user.isActive === false ? 'var(--danger)' : '#166534' }}>
                          {user.isActive === false ? 'Suspended' : 'Active'}
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(user._id, user.isActive)}
                            disabled={suspendingIds.has(user._id)}
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: 8,
                              border: 'none',
                              background: user.isActive === false ? 'var(--primary)' : '#B3261E',
                              color: '#fff',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {suspendingIds.has(user._id) ? 'Working...' : (user.isActive === false ? 'Reactivate' : 'Suspend')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
