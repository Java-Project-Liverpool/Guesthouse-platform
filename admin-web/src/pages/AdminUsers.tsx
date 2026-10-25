import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AdminUsersIcon } from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';
import { createAdminUser, getAdminUsers } from '../services/userService';
import type { User } from '../types';

export const AdminUsers: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // The request is awaited before any state is touched so the effect that
  // triggers it never sets state synchronously.
  const fetchAdmins = async () => {
    try {
      const res = await getAdminUsers();
      setAdmins(res.users ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Could not retrieve administrator accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadAdmins = async () => {
      try {
        const res = await getAdminUsers();
        if (isMounted) setAdmins(res.users ?? []);
      } catch (err: unknown) {
        if (isMounted) {
          setFetchError(err instanceof Error ? err.message : 'Could not retrieve administrator accounts.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAdmins();

    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP animation on list
  useEffect(() => {
    if (loading || admins.length === 0 || !listRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.admin-row',
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }, listRef);

    return () => ctx.revert();
  }, [loading, admins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await createAdminUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setMessage({ type: 'success', text: `Admin account for ${res.user.name} created successfully.` });
      setName('');
      setEmail('');
      setPassword('');
      setLoading(true);
      setFetchError('');
      fetchAdmins();
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not create admin account.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 960 }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          Admin users
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Personnel authorized to sign in to the Dumela Stays administration portal.
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 14,
            background: message.type === 'success' ? 'var(--accent-mint)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`,
            color: message.type === 'success' ? 'var(--accent-mint-text)' : 'var(--danger)',
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      {fetchError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: 14,
          }}
        >
          {fetchError}
        </div>
      )}

      {/* Admin Users List Card */}
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
            <AdminUsersIcon size={18} />
            <span>Active administrators ({admins.length})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setFetchError('');
              fetchAdmins();
            }}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-main)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          <span>Administrator</span>
          <span>Email address</span>
          <span>Status</span>
        </div>

        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading administrators...
            </div>
          ) : admins.length === 0 ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No administrator accounts found.
            </div>
          ) : (
            admins.map((adm) => {
              const isSelf = currentAdmin?.email === adm.email;
              const initials = adm.name
                ? adm.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'AD';

              return (
                <div
                  key={adm._id || adm.email}
                  className="admin-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1.5fr 1fr',
                    alignItems: 'center',
                    padding: '1rem 0',
                    borderBottom: '1px solid var(--border-main)',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {initials}
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      {adm.name}
                      {isSelf && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          (You)
                        </span>
                      )}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{adm.email}</span>
                  <div>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 14,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--accent-mint)',
                        color: 'var(--accent-mint-text)',
                      }}
                    >
                      Active Admin
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Admin Form Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
          Add an administrator
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          New administrators have full access to manage guesthouses, moderate reviews, and invite staff.
        </p>

        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Full name
              </label>
              <input
                type="text"
                placeholder="e.g. Kagiso Motsepe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--border-main)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="admin@dumela-stays.local"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--border-main)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Temporary password (minimum 8 characters)
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--border-main)',
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                maxWidth: 400,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.8rem 1.75rem',
                borderRadius: 14,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating account...' : 'Create admin account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;
