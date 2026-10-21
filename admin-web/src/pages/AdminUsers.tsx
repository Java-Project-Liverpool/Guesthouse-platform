import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createAdminUser } from '../services/userService';
import type { User } from '../types';

export const AdminUsers: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [admins, setAdmins] = useState<Array<{ name: string; email: string }>>([
    {
      name: currentAdmin?.name || 'Administrator',
      email: currentAdmin?.email || 'admin@example.com',
    },
    {
      name: 'System Admin',
      email: 'admin2@example.com',
    },
  ]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await createAdminUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const newAdmin: User = res.user;
      setAdmins((prev) => [...prev, { name: newAdmin.name, email: newAdmin.email }]);
      setMessage({ type: 'success', text: 'Admin account created successfully.' });
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not create admin account.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 960 }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          Admin users
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          People who can log in
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-main)', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          <span>Name</span>
          <span>Email</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {admins.map((adm, index) => {
            const initials = adm.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  alignItems: 'center',
                  padding: '1.25rem 0',
                  borderBottom: index < admins.length - 1 ? '1px solid var(--border-main)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--bg-card-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-main)',
                    }}
                  >
                    {initials || 'AD'}
                  </div>
                  <span style={{ fontWeight: 600 }}>{adm.name}</span>
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{adm.email}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Admin Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>+</span> Create new admin
        </h3>

        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin name"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Temporary password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem 2rem',
                borderRadius: 14,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;
