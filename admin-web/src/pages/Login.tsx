import React, { useState } from 'react';
import { MoonIcon, SunIcon } from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { apiFetch } from '../services/api';
import type { User } from '../types';

import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res?.token && res?.user) {
        if (res.user.role !== 'admin') {
          setError('Access denied: You must be an administrator to log into this portal.');
          setLoading(false);
          return;
        }

        login(res.token, res.user);
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        background: 'var(--bg-page)',
        color: 'var(--text-main)',
      }}
    >
      {/* Left Column: Landscape Graphic */}
      <div
        style={{
          background: 'linear-gradient(180deg, #38243E 0%, #B85246 50%, #20414D 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '4rem 3rem',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        {/* Sun illustration */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '15%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: '#FDE19C',
            boxShadow: '0 0 60px rgba(253, 225, 156, 0.4)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.03em',
            }}
          >
            Dumela Stays
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.2rem', margin: 0, fontWeight: 500 }}>
            Showcase Botswana guesthouses to travellers.
          </p>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem 2rem',
          position: 'relative',
        }}
      >
        {/* Theme toggle in top right */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '0.5rem',
              borderRadius: '50%',
              border: '1px solid var(--border-main)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {resolvedTheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>

        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <img src={logoImg} alt="Dumela Stays logo" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
              Admin login
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
              Sign in to manage listings
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '0.85rem 1rem',
                borderRadius: 12,
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="email-input"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--text-main)',
                }}
              >
                Email
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '1rem',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password-input"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--text-main)',
                }}
              >
                Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '1rem',
                  borderRadius: 12,
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.95rem',
                borderRadius: 14,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                fontWeight: 600,
                fontSize: '1.05rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              style={{ textDecoration: 'underline' }}
            >
              Back to portal home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
