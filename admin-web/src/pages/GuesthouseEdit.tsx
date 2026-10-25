import React, { useEffect, useState } from 'react';
import {
  createGuesthouse,
  getGuesthouseById,
  updateGuesthouse,
  uploadGuesthouseImage,
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

const PRESET_PHOTOS = [
  { label: 'Riverside Maun', url: '/stays/thamalakane-1.jpg' },
  { label: 'Kubu Baobab Retreat', url: '/stays/kubu-1.jpg' },
  { label: 'Okavango Delta Camp', url: '/stays/delta-1.jpg' },
  { label: 'Kalahari Rest Lodge', url: '/stays/kalahari-1.jpg' },
  { label: 'Boteti Sunset Deck', url: '/stays/boteti-1.jpg' },
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

  // Image State
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [imageError, setImageError] = useState('');

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
            setGallery(g.gallery || []);
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

  // Upload Logo handler
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setUploadingLogo(true);
    try {
      const res = await uploadGuesthouseImage(file, 'logo');
      setLogo(res.url);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Upload Gallery handler
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setUploadingGallery(true);
    try {
      const res = await uploadGuesthouseImage(file, 'gallery');
      setGallery((prev) => [...prev, res.url]);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Gallery photo upload failed.');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleAddGalleryUrl = () => {
    const trimmed = newGalleryUrl.trim();
    if (!trimmed) return;
    if (gallery.includes(trimmed)) {
      setImageError('This image URL is already in the gallery.');
      return;
    }
    setGallery((prev) => [...prev, trimmed]);
    setNewGalleryUrl('');
    setImageError('');
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedLogo = logo.trim();
    if (!trimmedLogo) {
      setMessage({ type: 'error', text: 'A cover image / logo is required.' });
      return;
    }

    setLoading(true);

    const payload: Partial<Guesthouse> = {
      name: name.trim(),
      description: description.trim(),
      amenities: selectedAmenities,
      city: city.trim(),
      country: country.trim(),
      pricePerNight: Number(pricePerNight) || 0,
      logo: trimmedLogo,
      gallery,
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
      }, 900);
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
          Fill in each section with real property details, then save to the database.
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

      {imageError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 12,
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {imageError}
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
                  Price per night (Botswana Pula — P)
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

          {/* Card 4: Images & Previews */}
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
              <span>🖼️</span> Images & Previews
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Section 4A: Logo / Cover Image */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Cover photo / Logo <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Logo Live Preview */}
                {logo ? (
                  <div
                    style={{
                      height: 160,
                      borderRadius: 14,
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid var(--border-main)',
                      background: 'var(--bg-card-subtle)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <img
                      src={logo}
                      alt="Cover preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: 100,
                      borderRadius: 14,
                      border: '2px dashed var(--border-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    No cover image selected
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label
                    style={{
                      padding: '0.55rem 0.95rem',
                      borderRadius: 10,
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    📁 {uploadingLogo ? 'Uploading file...' : 'Choose file...'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoFileUpload}
                      disabled={uploadingLogo}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="Or paste image URL (e.g. /stays/thamalakane-1.jpg)"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 10,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Section 4B: Gallery Photos */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Gallery Photos ({gallery.length})
                </label>

                {/* Gallery Previews Grid */}
                {gallery.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {gallery.map((imgUrl, i) => (
                      <div
                        key={`${imgUrl}-${i}`}
                        style={{
                          height: 80,
                          borderRadius: 10,
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid var(--border-main)',
                          background: 'var(--bg-card-subtle)',
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(i)}
                          title="Remove photo"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 12,
                      border: '1px dashed var(--border-main)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    No gallery photos added yet.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label
                    style={{
                      padding: '0.55rem 0.95rem',
                      borderRadius: 10,
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: uploadingGallery ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    📁 {uploadingGallery ? 'Uploading...' : 'Upload photo...'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleGalleryFileUpload}
                      disabled={uploadingGallery}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Or add photo URL..."
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: 10,
                      border: 'none',
                      background: 'var(--primary)',
                      color: 'var(--primary-text)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>

                {/* Presets Quick Picker */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Quick presets (Botswana stays):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {PRESET_PHOTOS.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => {
                          if (!logo) setLogo(p.url);
                          else if (!gallery.includes(p.url)) setGallery((prev) => [...prev, p.url]);
                        }}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 8,
                          border: '1px solid var(--border-main)',
                          background: 'var(--bg-card-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show a verified badge on discovery apps</div>
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Active on platform</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Travellers can discover this guesthouse</div>
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

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving to database...' : isEditing ? 'Save changes' : 'Register guesthouse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GuesthouseEdit;
