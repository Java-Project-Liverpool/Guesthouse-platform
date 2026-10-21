import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../types';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Administrator');
  const [email, setEmail] = useState(user?.email || 'admin@example.com');
  const [profileMsg, setProfileMsg] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications toggles
  const [newRatingNotif, setNewRatingNotif] = useState(true);
  const [newCustomerNotif, setNewCustomerNotif] = useState(true);
  const [weeklySummaryNotif, setWeeklySummaryNotif] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('Profile saved on this device.');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordMsg({
      type: 'success',
      text: 'Password updated. (Use this new password on your next sign-in)',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          Settings
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Manage your profile and preferences
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Profile & Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Card: Profile */}
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
              <span>👤</span> Profile
            </h3>

            {profileMsg && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: 'var(--accent-mint)', color: 'var(--accent-mint-text)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {profileMsg}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                }}
              >
                {initials}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => alert('Photo upload dialog: Select a profile picture.')}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Change photo
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <button
                  type="submit"
                  style={{
                    padding: '0.85rem 1.75rem',
                    borderRadius: 14,
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'var(--primary-text)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Save profile
                </button>
              </div>
            </form>
          </div>

          {/* Card: Password */}
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
              <span>🔒</span> Password
            </h3>

            {passwordMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  marginBottom: '1.25rem',
                  background: passwordMsg.type === 'success' ? 'var(--accent-mint)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`,
                  color: passwordMsg.type === 'success' ? 'var(--accent-mint-text)' : 'var(--danger)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
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
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
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
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
                <button
                  type="submit"
                  style={{
                    padding: '0.85rem 1.75rem',
                    borderRadius: 14,
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'var(--primary-text)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Appearance, Notifications, Session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Card: Appearance */}
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
              <span>🌙</span> Appearance
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                background: 'var(--bg-card-subtle)',
                padding: '0.4rem',
                borderRadius: 18,
                border: '1px solid var(--border-main)',
              }}
            >
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
                const isSelected = theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    style={{
                      padding: '0.75rem 0',
                      borderRadius: 14,
                      border: 'none',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      color: isSelected ? 'var(--primary-text)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Notifications */}
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
              <span>🔔</span> Notifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>New rating</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Alert when a customer rates a stay
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newRatingNotif}
                  onChange={(e) => setNewRatingNotif(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>New customer</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Alert when someone signs up
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newCustomerNotif}
                  onChange={(e) => setNewCustomerNotif(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Weekly summary</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Email with platform stats
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={weeklySummaryNotif}
                  onChange={(e) => setWeeklySummaryNotif(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Card: Session */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚪</span> Session
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              You are signed in on this device.
            </p>

            <button
              type="button"
              onClick={logout}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 14,
                border: '1px solid var(--border-main)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
