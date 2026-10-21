import React, { useState } from 'react';
import { SearchIcon } from '../components/ui/Icons';

interface AppUser {
  id: string;
  name: string;
  email: string;
  joined: string;
  favourites: number;
  ratings: number;
  status: 'Active' | 'Disabled';
}

export const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Disabled'>('All');

  // Customer users state
  const [users, setUsers] = useState<AppUser[]>([
    {
      id: '1',
      name: 'Thabo Kgosi',
      email: 'customer1@example.com',
      joined: '12 Sep 2026',
      favourites: 3,
      ratings: 5,
      status: 'Active',
    },
    {
      id: '2',
      name: 'Lesego Molapo',
      email: 'customer2@example.com',
      joined: '24 Sep 2026',
      favourites: 1,
      ratings: 2,
      status: 'Active',
    },
    {
      id: '3',
      name: 'Kagiso Tau',
      email: 'customer3@example.com',
      joined: '02 Oct 2026',
      favourites: 0,
      ratings: 0,
      status: 'Active',
    },
    {
      id: '4',
      name: 'Naledi Sebele',
      email: 'customer4@example.com',
      joined: '08 Oct 2026',
      favourites: 2,
      ratings: 1,
      status: 'Disabled',
    },
  ]);

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || u.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          App users
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Disabled users can't log in. Their ratings stay on the platform.
        </div>
      </div>

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
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 18,
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)',
            flex: 1,
            maxWidth: 420,
          }}
        >
          <SearchIcon size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
        </div>

        {/* Status Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-subtle)',
            borderRadius: 20,
            padding: '0.3rem',
            border: '1px solid var(--border-main)',
          }}
        >
          {(['All', 'Active', 'Disabled'] as const).map((tab) => (
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
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
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
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Customer</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Email</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Joined</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Favourites</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Ratings</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ paddingBottom: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              )}

              {filteredUsers.map((user) => {
                const isActive = user.status === 'Active';
                const initials = user.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--border-main)',
                    }}
                  >
                    <td style={{ padding: '1rem 0', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'var(--bg-card-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                          }}
                        >
                          {initials}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{user.email}</td>

                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{user.joined}</td>

                    <td style={{ padding: '1rem 0', fontWeight: 600 }}>{user.favourites}</td>

                    <td style={{ padding: '1rem 0', fontWeight: 600 }}>{user.ratings}</td>

                    <td style={{ padding: '1rem 0' }}>
                      <span
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: 20,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: isActive ? 'var(--status-visible-bg)' : 'var(--status-hidden-bg)',
                          color: isActive ? 'var(--status-visible-text)' : 'var(--status-hidden-text)',
                          display: 'inline-block',
                        }}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: 12,
                          border: '1px solid var(--border-main)',
                          background: 'transparent',
                          color: isActive ? 'var(--danger)' : 'var(--primary)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        {isActive ? '× Disable' : '✓ Enable'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
