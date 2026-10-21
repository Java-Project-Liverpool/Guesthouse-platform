import React, { useEffect, useState } from 'react';
import {
  EditIcon,
  HideIcon,
  UnhideIcon,
  StarIcon,
} from '../components/ui/Icons';
import { HideGuesthouseModal } from '../components/ui/Modal';
import {
  getGuesthouseById,
  setGuesthouseVisibility,
} from '../services/guesthouseService';
import type { Guesthouse } from '../types';

interface GuesthouseDetailProps {
  id: string;
}

export const GuesthouseDetail: React.FC<GuesthouseDetailProps> = ({ id }) => {
  const [guesthouse, setGuesthouse] = useState<Guesthouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const reloadDetails = () => {
    setLoading(true);
    getGuesthouseById(id)
      .then((res) => {
        if (res?.guesthouse) {
          setGuesthouse(res.guesthouse);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load listing details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    getGuesthouseById(id)
      .then((res) => {
        if (isMounted && res?.guesthouse) {
          setGuesthouse(res.guesthouse);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not load listing details.');
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
  }, [id]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleConfirmVisibility = async () => {
    if (!guesthouse) return;
    setActionLoading(true);
    try {
      const newStatus = guesthouse.isActive === false;
      await setGuesthouseVisibility(guesthouse._id, newStatus);
      setModalOpen(false);
      reloadDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading guesthouse details...</div>;
  }

  if (error || !guesthouse) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'Guesthouse not found'}</p>
        <button
          type="button"
          onClick={() => navigateTo('/guesthouses')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 12,
            border: '1px solid var(--border-main)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
          }}
        >
          Back to list
        </button>
      </div>
    );
  }

  const isVisible = guesthouse.isActive !== false;
  const initials = guesthouse.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const galleryImages = guesthouse.gallery && guesthouse.gallery.length > 0
    ? guesthouse.gallery
    : [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      ];

  const mainImage = guesthouse.logo || galleryImages[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            {guesthouse.name}
          </h2>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            {guesthouse.city}, {guesthouse.country}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigateTo(`/guesthouses/${guesthouse._id}/edit`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.25rem',
              borderRadius: 14,
              border: '1px solid var(--border-main)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <EditIcon size={16} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.25rem',
              borderRadius: 14,
              border: '1px solid var(--border-main)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {isVisible ? <HideIcon size={16} /> : <UnhideIcon size={16} />}
            <span>{isVisible ? 'Hide from app' : 'Unhide'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Visuals & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Gallery showcase */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                background: 'var(--bg-card-subtle)',
              }}
            >
              <img
                src={mainImage}
                alt={guesthouse.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {galleryImages.slice(0, 4).map((imgUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    aspectRatio: '1 / 1',
                    background: 'var(--bg-card-subtle)',
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${guesthouse.name} photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Description Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
              {guesthouse.description || 'No description provided.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {guesthouse.amenities?.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 20,
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {amenity}
                </span>
              ))}
              {guesthouse.verificationStatus === 'verified' && (
                <span
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 20,
                    background: 'var(--accent-mint)',
                    color: 'var(--accent-mint-text)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Listing Metadata */}
        <div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-main)', paddingBottom: '1.25rem' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{guesthouse.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{guesthouse.city}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Price</span>
                <span style={{ fontWeight: 700 }}>
                  {guesthouse.pricePerNight ? `P${guesthouse.pricePerNight.toLocaleString()} / night` : '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>City</span>
                <span style={{ fontWeight: 600 }}>{guesthouse.city}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Country</span>
                <span style={{ fontWeight: 600 }}>{guesthouse.country}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coordinates</span>
                <span style={{ fontWeight: 600 }}>
                  {guesthouse.location
                    ? `${guesthouse.location.latitude}, ${guesthouse.location.longitude}`
                    : '-19.9833, 23.4167'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                <span style={{ fontWeight: 600 }}>{guesthouse.contact?.phone || '+267 000 0000'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                <span style={{ fontWeight: 600 }}>{guesthouse.contact?.email || 'host@example.com'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rating</span>
                <span style={{ fontWeight: 700, color: 'var(--star-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <StarIcon size={16} />
                  <span>{guesthouse.averageRating ?? '4.9'} ({guesthouse.ratingsCount ?? 128})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HideGuesthouseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmVisibility}
        guesthouseName={guesthouse.name}
        isCurrentlyActive={isVisible}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default GuesthouseDetail;
