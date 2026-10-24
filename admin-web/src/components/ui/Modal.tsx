import React, { useEffect } from 'react';
import { HideIcon } from './Icons';

interface HideGuesthouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  guesthouseName?: string;
  isCurrentlyActive?: boolean;
  isLoading?: boolean;
}

export const HideGuesthouseModal: React.FC<HideGuesthouseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  guesthouseName,
  isCurrentlyActive = true,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          maxWidth: 480,
          width: '100%',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-main)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid var(--border-main)',
          }}
        >
          <HideIcon size={26} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
          {isCurrentlyActive ? 'Hide this guesthouse?' : 'Unhide this guesthouse?'}
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 2rem' }}>
          {isCurrentlyActive
            ? `It will disappear from the customer app but stays in your records.${
                guesthouseName ? ` (${guesthouseName})` : ''
              } You can unhide it at any time.`
            : `It will become visible to travelers browsing on the discovery platform again.${
                guesthouseName ? ` (${guesthouseName})` : ''
              }`}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.85rem 1.25rem',
              borderRadius: 14,
              border: '1px solid var(--border-main)',
              background: 'transparent',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.85rem 1.25rem',
              borderRadius: 14,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-text)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isLoading
              ? 'Saving...'
              : isCurrentlyActive
              ? 'Hide guesthouse'
              : 'Unhide guesthouse'}
          </button>
        </div>
      </div>
    </div>
  );
};
