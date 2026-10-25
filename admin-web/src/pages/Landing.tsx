import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SunIcon, MoonIcon, StarIcon } from '../components/ui/Icons';
import { useTheme } from '../hooks/useTheme';
import { getAllGuesthouses } from '../services/guesthouseService';
import type { Guesthouse } from '../types';

import heroPhoto from '../assets/stays/kubu-1.jpg';
import logoImg from '../assets/logo.png';
import thamalakanePhoto from '../assets/stays/thamalakane-1.jpg';
import kubuPhoto from '../assets/stays/kubu-1.jpg';
import deltaPhoto from '../assets/stays/delta-1.jpg';
import kalahariPhoto from '../assets/stays/kalahari-1.jpg';
import botetiPhoto from '../assets/stays/boteti-1.jpg';

gsap.registerPlugin(ScrollTrigger);

/**
 * Photograph with a graceful fallback: if the asset cannot be decoded the
 * frame becomes a branded panel instead of a broken image icon.
 */
const SafePhoto: React.FC<
  React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }
> = ({ src, alt, onError, ...rest }) => {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--bg-card-subtle) 100%)',
        }}
      />
    );
  }

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
};

// Botswana stay photography held in the project assets. Captions describe the
// region and the scene only — they are not linked to specific listings.
const GALLERY_IMAGES = [
  {
    title: 'Thamalakane River, Maun',
    subtitle: 'Riverside lodge at dusk with a private jetty',
    src: thamalakanePhoto,
  },
  {
    title: 'Kubu Island',
    subtitle: 'Stone suites, still pool and an ancient baobab',
    src: kubuPhoto,
  },
  {
    title: 'Okavango Delta',
    subtitle: 'Canvas tents on the floodplain at sunset',
    src: deltaPhoto,
  },
  {
    title: 'Kalahari',
    subtitle: 'Thatched chalets glowing under an open sky',
    src: kalahariPhoto,
  },
  {
    title: 'Boteti River',
    subtitle: 'Stone cottage, pool and palms above the floodplain',
    src: botetiPhoto,
  },
];

const LOCATIONS = [
  'Maun',
  'Gaborone',
  'Kasane',
  'Francistown',
  'Okavango Delta',
  'Chobe',
  'Kalahari',
  'Boteti',
];

export const Landing: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    getAllGuesthouses()
      .then((res) => {
        if (isMounted && res?.guesthouses) {
          setGuesthouses(res.guesthouses);
        }
      })
      .catch(() => {
        // Fallback gracefully if backend is temporarily unreachable
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP animations with proper cleanup and reduced-motion checks
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Header entrance animation
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
        );
      }

      // 2. Staggered hero text entrance
      if (heroContentRef.current) {
        gsap.fromTo(
          heroContentRef.current.children,
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
        );
      }

      // 3. Cinematic hero photo & rating card entrance
      if (heroMediaRef.current) {
        gsap.fromTo(
          heroMediaRef.current,
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.25 }
        );

        gsap.fromTo(
          '.floating-card',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.75 }
        );
      }

      // 4. Stats section reveal
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.querySelectorAll('.landing-stat-card'),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
            },
          }
        );
      }

      // 5. Features section staggered reveal
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.querySelectorAll('.landing-feature-card'),
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 80%',
            },
          }
        );
      }

      // 6. How it works steps reveal
      if (stepsRef.current) {
        gsap.fromTo(
          stepsRef.current.querySelectorAll('.landing-step-row'),
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 80%',
            },
          }
        );
      }

      // 7. Gallery photo reveals
      if (galleryRef.current) {
        gsap.fromTo(
          galleryRef.current.children,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: galleryRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const totalCount = guesthouses.length;
  const citiesCovered = new Set(guesthouses.map((g) => g.city).filter(Boolean)).size;
  const topRatedStay = guesthouses.find((g) => (g.averageRating ?? 0) >= 4.5) || guesthouses[0];

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}
    >
      {/* Header / Navbar */}
      <header
        ref={headerRef}
        className="landing-header"
        style={{
          borderBottom: '1px solid var(--border-main)',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Brand logo & name properly aligned */}
        <div className="landing-brand" onClick={() => navigateTo('/')}>
          <img
            src={logoImg}
            alt="Dumela Stays logo"
            style={{
              width: 38,
              height: 38,
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />
          <span className="landing-brand-name">Dumela Stays</span>
        </div>

        {/* Navigation links & Actions */}
        <nav className="landing-nav">
          <div className="landing-nav-links">
            <a href="#features" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#how-it-works" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
              How it works
            </a>
            <a href="#gallery" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
              Stays Gallery
            </a>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
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

          {/* Admin Login Button */}
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: 24,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-text)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'opacity 0.2s',
            }}
          >
            <span>&bull;</span>
            <span>Admin login</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '4rem 2rem 3.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: '3.5rem',
          alignItems: 'center',
        }}
      >
        <div ref={heroContentRef}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'var(--accent-mint)',
              padding: '0.35rem 0.9rem',
              borderRadius: 20,
              marginBottom: '1.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>&bull;</span>
            <span>Discovery Platform</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.1,
              fontWeight: 800,
              margin: '0 0 1.5rem',
              letterSpacing: '-0.03em',
            }}
          >
            Showcase<br />
            Botswana<br />
            guesthouses to<br />
            the world
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              marginBottom: '2.5rem',
              maxWidth: 480,
            }}
          >
            Register stays, manage listings and keep an eye on what travellers rate highly across Botswana. No booking commissions, no hidden fees, just pure discovery.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigateTo('/login')}
              style={{
                padding: '0.9rem 2.25rem',
                borderRadius: 24,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              Sign in to admin portal
            </button>
            <a
              href="#gallery"
              style={{
                padding: '0.9rem 2rem',
                borderRadius: 24,
                border: '1px solid var(--border-main)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '1rem',
                display: 'inline-block',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Explore stays
            </a>
          </div>
        </div>

        {/* Hero Photographic Container */}
        <div ref={heroMediaRef} style={{ position: 'relative' }}>
          <div
            style={{
              borderRadius: 32,
              aspectRatio: '4 / 3',
              width: '100%',
              maxWidth: 560,
              margin: '0 auto',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-main)',
            }}
          >
            <SafePhoto
              src={heroPhoto}
              alt="Botswana guesthouse terrace at sunset with a baobab tree and campfire"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />

            {/* Subtle Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(18,42,30,0.65) 100%)',
              }}
            />

            {/* Floating Top Rating Card */}
            <div
              className="floating-card"
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#122A1E',
                backdropFilter: 'blur(8px)',
                padding: '0.85rem 1.25rem',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--star-gold)', display: 'flex', alignItems: 'center' }}>
                  <StarIcon size={22} filled />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {topRatedStay ? topRatedStay.name : 'Highest rated stay'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5F6B63' }}>
                    {topRatedStay?.city || 'Live ratings from travellers'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--accent-mint)',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 12,
                }}
              >
                ★ {topRatedStay?.averageRating ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Ribbon — Seamless Continuous Carousel */}
      <div
        style={{
          borderTop: '1px solid var(--border-main)',
          borderBottom: '1px solid var(--border-main)',
          padding: '1.25rem 0',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="carousel-track"
          role="group"
          aria-label="Botswana locations"
          tabIndex={0}
          style={{
            color: 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.02em',
          }}
        >
          {/* Four identical copies: the animation shifts by exactly one copy
              (-25% of the track), so the loop closes without a visible seam. */}
          {Array.from({ length: 4 }, (_, copy) => (
            <div
              key={copy}
              className="carousel-copy"
              aria-hidden={copy > 0 ? true : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2.5rem',
                paddingRight: '2.5rem',
              }}
            >
              {LOCATIONS.map((city) => (
                <span
                  key={city}
                  style={{
                    userSelect: 'none',
                    cursor: 'default',
                    padding: '0 0.5rem',
                  }}
                >
                  &bull; {city}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section — Genuine Database Counts */}
      <section ref={statsRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.5rem' }}>
          {[
            {
              value: loading ? '...' : String(totalCount),
              label: totalCount === 1 ? 'Guesthouse listed' : 'Guesthouses listed',
            },
            {
              value: loading ? '...' : String(citiesCovered),
              label: citiesCovered === 1 ? 'City covered' : 'Cities covered',
            },
            {
              value: '100%',
              label: 'Botswana focused',
            },
            {
              value: '0',
              label: 'Booking fees or commissions',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="landing-stat-card"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 20,
                padding: '2rem 1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem', color: 'var(--primary)' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Platform Features
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', maxWidth: 540 }}>
            Everything administrators need, nothing unnecessary
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>
          {[
            {
              title: 'Register & edit stays',
              desc: 'High-res photos, amenities tags, prices in Pula, and geographic coordinates all in one central dashboard.',
            },
            {
              title: 'Monitor real traveller ratings',
              desc: 'Track ratings from the companion mobile app, discover top-rated accommodations, and moderate reviews.',
            },
            {
              title: 'Administrator role guards',
              desc: 'Strict JWT authorization, staff account invitations, and customer account directory.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="landing-feature-card"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 20,
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, fontSize: '0.95rem' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" ref={stepsRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Workflow
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            From listing to discovery in three steps
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              step: 1,
              title: 'Admin registers a guesthouse',
              desc: 'Upload cover photos, gallery images, amenities and night rates into the database.',
            },
            {
              step: 2,
              title: 'Travellers discover through mobile app',
              desc: 'Search by city, price range, or amenities. View authentic accommodation photos and direct contact numbers.',
            },
            {
              step: 3,
              title: 'Customer ratings flow back to dashboard',
              desc: 'Travellers rate their stay and leave feedback, which automatically populates your admin dashboard metrics.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="landing-step-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 16,
                padding: '1.25rem 1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'var(--primary-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 700 }}>
                  {item.title}
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section — Real Local Botswana Guesthouse Imagery */}
      <section id="gallery" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Accommodations Showcase
          </div>
          <h2
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
              maxWidth: 640,
              lineHeight: 1.25,
            }}
          >
            Botswana has stays beside rivers, under baobabs and across open savanna.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, maxWidth: 540 }}>
            Dumela Stays helps every unique accommodation be discovered by travellers.
          </p>
        </div>

        <div
          ref={galleryRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '1.5rem',
          }}
        >
          {GALLERY_IMAGES.map((item) => (
            <div
              key={item.title}
              style={{
                height: 300,
                borderRadius: 24,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-md)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-main)',
              }}
            >
              <SafePhoto
                src={item.src}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.06, duration: 0.5, ease: 'power2.out' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.5, ease: 'power2.out' });
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                  color: '#FFFFFF',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.2rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        style={{
          background: 'var(--bg-sidebar)',
          color: '#FFFFFF',
          padding: '4.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <img src={logoImg} alt="Dumela Stays logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.75rem', color: '#FFFFFF' }}>
            Ready to manage your Botswana listings?
          </h2>
          <p style={{ color: 'var(--sidebar-muted)', marginBottom: '2.25rem', fontSize: '1.05rem', lineHeight: 1.5 }}>
            Sign in to the administrative portal to manage listings, monitor traveler ratings, and invite staff members.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            style={{
              padding: '0.95rem 2.5rem',
              borderRadius: 24,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-text)',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            }}
          >
            Sign in to Admin Portal
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
