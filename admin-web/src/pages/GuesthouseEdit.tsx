import React, { useEffect, useState } from 'react';
import {
  createGuesthouse,
  getGuesthouseById,
  updateGuesthouse,
} from '../services/guesthouseService';
import type { Guesthouse } from '../types';

interface GuesthouseEditProps {
  id?: string;
}

const AVAILABLE_AMENITIES = [
  'Wi-Fi',
  'Pool',
  'Breakfast',
  'Parking',
  'Air Conditioning',
  'Restaurant',
  'Bar',
  'Airport Shuttle',
];

export const GuesthouseEdit: React.FC<GuesthouseEditProps> = ({ id }) => {
  const isEditing = Boolean(id);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Wi-Fi', 'Breakfast']);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Botswana');
  const [latitude, setLatitude] = useState('-19.9833');
  const [longitude, setLongitude] = useState('23.4167');
  const [pricePerNight, setPricePerNight] = useState<number | string>(1250);
  const [phone, setPhone] = useState('+267 ');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      getGuesthouseById(id)
        .then((res) => {
          if (isMounted && res?.guesthouse) {
            const g = res.guesthouse;
            setName(g.name || '');
            setDescription(g.description || '');
            setSelectedAmenities(g.amenities || []);
            setCity(g.city || '');
            setCountry(g.country || 'Botswana');
            if (g.location) {
              setLatitude(String(g.location.latitude ?? ''));
              setLongitude(String(g.location.longitude ?? ''));
            }
            setPricePerNight(g.pricePerNight ?? 0);
            if (g.contact) {
              setPhone(g.contact.phone || '+267 ');
              setEmail(g.contact.email || '');
            }
            setLogo(g.logo || '');
            setGalleryInput((g.gallery || []).join(', '));
            setIsVerified(g.verificationStatus === 'verified');
            setIsActive(g.isActive !== false);
          }
        })
        .catch((err: unknown) => {
          setMessage({
            type: 'error',
            text: err instanceof Error ? err.message : 'Could not fetch guesthouse details.',
          });
        })
        .finally(() => {
          if (isMounted) setInitialLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const galleryList = galleryInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: Partial<Guesthouse> = {
      name: name.trim(),
      description: description.trim(),
      amenities: selectedAmenities,
      city: city.trim(),
      country: country.trim(),
      pricePerNight: Number(pricePerNight) || 0,
      logo: logo.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      gallery: galleryList.length > 0 ? galleryList : [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      ],
      location: {
        latitude: parseFloat(latitude) || -19.9833,
        longitude: parseFloat(longitude) || 23.4167,
      },
      contact: {
        phone: phone.trim(),
        email: email.trim(),
      },
      verificationStatus: isVerified ? 'verified' : 'pending',
      isActive,
    };

    try {
      if (isEditing && id) {
        await updateGuesthouse(id, payload);
        setMessage({ type: 'success', text: 'Guesthouse updated successfully!' });
      } else {
        await createGuesthouse(payload);
        setMessage({ type: 'success', text: 'Guesthouse registered successfully!' });
      }

      setTimeout(() => {
        navigateTo('/guesthouses');
      }, 1000);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save operation failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading guesthouse details...</div>;
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          {isEditing ? 'Edit guesthouse' : 'Register guesthouse'}
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Fill in each section, then save
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 14,
            marginBottom: '1.5rem',
            background: message.type === 'success' ? 'var(--accent-mint)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`,
            color: message.type === 'success' ? 'var(--accent-mint-text)' : 'var(--danger)',
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: Details */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏨</span> Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Thamalakane River Haven"
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
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guesthouse description..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: 12,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-muted)' }}>
                  Amenities
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: 20,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                          background: isSelected ? 'var(--primary)' : 'var(--bg-card-subtle)',
                          color: isSelected ? 'var(--primary-text)' : 'var(--text-main)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Location */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📍</span> Location
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Maun"
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
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Botswana"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Latitude
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-19.9833"
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
                  Longitude
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="23.4167"
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
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 3: Price and Contact */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏷️</span> Price and contact
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Price per night (P)
                </label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  placeholder="1250"
                  min="0"
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
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+267 71 234 567"
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
                  placeholder="host@example.com"
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
          </div>

          {/* Card 4: Images */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🖼️</span> Images
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Upload logo (or Image URL)
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.jpg"
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
                  Upload gallery photos (comma-separated URLs)
                </label>
                <input
                  type="text"
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  placeholder="https://.../photo1.jpg, https://.../photo2.jpg"
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
          </div>

          {/* Card 5: Visibility */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 20,
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👁️</span> Visibility
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Verified</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show a verified badge</div>
                </div>
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Visible</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highlight on the app home & discovery</div>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigateTo('/guesthouses')}
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: 14,
                border: '1px solid var(--border-main)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
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
              {loading ? 'Saving...' : 'Save guesthouse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GuesthouseEdit;
