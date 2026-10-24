import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SunIcon, MoonIcon, StarIcon } from '../components/ui/Icons';
import { useTheme } from '../hooks/useTheme';
import { getAllGuesthouses } from '../services/guesthouseService';
import type { Guesthouse } from '../types';

import heroPhoto from '../assets/Terracotta Sunrise Over Green Fields.png';
import logoImg from '../assets/logo.png';

gsap.registerPlugin(ScrollTrigger);

// Real Botswana guesthouse images — replace these placeholder Unsplash URLs
// with actual photos downloaded from Google Maps / cinematic guesthouse shots.
const GALLERY_IMAGES = [
  { title: 'River Sunset in Maun', src: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80' },
  { title: 'Kubu Island Baobab', src: 'https://images.unsplash.com/photo-1534177616072-8e8b2b0e9e9c?auto=format&fit=crop&w=800&q=80' },
  { title: 'Savanna Sunset', src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80' },
];

const LOCATIONS = ['Gaborone', 'Maun', 'Kasane', 'Francistown', 'Okavango Delta', 'Chobe', 'Kalahari'];

export const Landing: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);

  useEffect(() => {
    getAllGuesthouses()
      .then((res) => {
        if (res?.guesthouses) {
          setGuesthouses(res.guesthouses);
        }
      })
      .catch(() => {
        // Fallback for landing showcase if backend unavailable
      });
  }, []);

  // GSAP animations
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    if (!heroRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      // Hero title animation
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );

      // Hero image entrance
      gsap.fromTo(
        heroRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );

      // Floating card animation
      gsap.fromTo(
        '.floating-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.6 }
      );

      // Gallery scroll-triggered animation
      if (galleryRef.current) {
        gsap.fromTo(
          galleryRef.current.children,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: galleryRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const totalCount = guesthouses.length > 0 ? guesthouses.length : 148;
  const citiesCovered = new Set(guesthouses.map((g) => g.city).filter(Boolean)).size || 12;

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      {/* Navbar */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-main)',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigateTo('/')}>
          <img src={logoImg} alt="Dumela Stays logo" style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Dumela Stays</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <a href="#features" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Features</a>
          <a href="#how-it-works" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>How it works</a>
          <a href="#gallery" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Gallery</a>

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
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
          padding: '4rem 2rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              textTransform: 'lowercase',
            }}
          >
            <span>&bull;</span>
            <span>Admin portal</span>
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
            Register stays, manage listings and keep an eye on what travellers rate highly. No bookings, no fees, just discovery.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigateTo('/login')}
              style={{
                padding: '0.9rem 2rem',
                borderRadius: 24,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Admin login
            </button>
            <a
              href="#features"
              style={{
                padding: '0.9rem 2rem',
                borderRadius: 24,
                border: '1px solid var(--border-main)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '1rem',
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              See features
            </a>
          </div>
        </div>

        {/* Hero Illustration with Real Guesthouse Images */}
        <div ref={heroRef} style={{ position: 'relative' }}>
          <div
            style={{
              borderRadius: 32,
              aspectRatio: '1 / 1',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <img
              src={heroPhoto}
              alt="Cinematic Botswana guesthouse — terracotta sunrise over green fields"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 30%',
              }}
            />
            {/* Floating Top Rating Card */}
            <div
              className="floating-card"
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#122A1E',
                backdropFilter: 'blur(8px)',
                padding: '0.85rem 1.25rem',
                borderRadius: 16,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{ color: 'var(--star-gold)' }}>
                <StarIcon size={20} filled />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>4.9 top rating</div>
                <div style={{ fontSize: '0.8rem', color: '#5F6B63' }}>Thamalakane River Haven</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Ribbon — Continuous Seamless Carousel */}
      <div
        style={{
          borderTop: '1px solid var(--border-main)',
          borderBottom: '1px solid var(--border-main)',
          padding: '1.25rem 2rem',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          position: 'relative',
        }}
        aria-label="Botswana locations"
      >
        <div className="carousel-track" style={{ maxWidth: 1200, margin: '0 auto', gap: '2rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', alignItems: 'center' }}>
          {[...LOCATIONS, ...LOCATIONS].map((city, i) => (
            <span key={`${city}-${i}`} style={{ userSelect: 'none', cursor: 'default', padding: '0 0.5rem' }} aria-label={city}>
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { value: String(totalCount), label: 'Guesthouses listed' },
            { value: '1,842', label: 'Traveller ratings' },
            { value: String(citiesCovered), label: 'Cities covered' },
            { value: '0', label: 'Booking fees' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 20,
                padding: '2rem 1.75rem',
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Features
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', maxWidth: 480 }}>
            Everything an admin needs, nothing they do not
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              title: 'Register guesthouses',
              desc: 'Photos, amenities, price and location in one form. Hide a listing any time.',
            },
            {
              title: 'Track ratings',
              desc: 'See the top-rated stay, the busiest city and rating trends.',
            },
            {
              title: 'Manage people',
              desc: 'Add admins and disable customer accounts when needed.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 20,
                padding: '2rem',
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
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            How it works
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            From listing to discovery in three steps
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              step: 1,
              title: 'Register a guesthouse',
              desc: 'An admin adds the details and photos.',
            },
            {
              step: 2,
              title: 'Travellers discover it',
              desc: 'The mobile app searches by name or place, cheapest first.',
            },
            {
              step: 3,
              title: 'Customers rate and save',
              desc: 'Ratings and favourites flow back to your dashboard.',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: 16,
                padding: '1.25rem 1.75rem',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'var(--primary-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.95rem',
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

      {/* Gallery Section */}
      <section id="gallery" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <h2
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            margin: '0 0 2rem',
            letterSpacing: '-0.02em',
            maxWidth: 640,
            lineHeight: 1.25,
          }}
        >
          Botswana has stays beside rivers, under baobabs and across open savanna. Dumela Stays helps every one of them be found.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }} ref={galleryRef}>
          {GALLERY_IMAGES.map((item) => (
            <div
              key={item.title}
              style={{
                height: 280,
                borderRadius: 24,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-md)',
                background: 'var(--bg-card-subtle)',
              }}
            >
              <img
                src={item.src}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transition: 'transform 0.6s ease',
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.08, duration: 0.5, ease: 'power3.out' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.5, ease: 'power3.out' });
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {item.title}
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
          padding: '4rem 2rem',
          textAlign: 'center',
          marginTop: '2rem',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
            Ready to manage your listings?
          </h2>
          <p style={{ color: 'var(--sidebar-muted)', marginBottom: '2rem' }}>
            Sign in to the admin portal.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            style={{
              padding: '0.85rem 2.25rem',
              borderRadius: 24,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-text)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Admin login
          </button>
        </div>
      </section>
    </div>
  );
};
