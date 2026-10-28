import React, { useEffect, useRef } from 'react';
import { AlertTriangleIcon, HideIcon } from './Icons';

interface CustomerStatusConfirmationModalProps {
  isOpen: boolean;
  isSuspending: boolean;
  customerName?: string;
  customerEmail?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CustomerStatusConfirmationModal: React.FC<CustomerStatusConfirmationModalProps> = ({
  isOpen,
  isSuspending,
  customerName,
  customerEmail,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isLoadingRef = useRef(isLoading);
  const titleId = 'customer-status-confirmation-title';
  const descriptionId = 'customer-status-confirmation-description';

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isLoadingRef.current) onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && isLoading) dialogRef.current?.focus();
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const customer = customerName || customerEmail;
  const title = isSuspending ? 'Suspend customer account?' : 'Restore customer account?';
  const description = isSuspending
    ? 'This customer will no longer be able to sign in or access customer-only features.'
    : 'This customer will regain access to their account and be able to sign in again.';
  const confirmLabel = isLoading
    ? (isSuspending ? 'Suspending...' : 'Restoring...')
    : (isSuspending ? 'Suspend Account' : 'Unsuspend Account');

  return (
    <div
      className="customer-status-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="customer-status-modal"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={`customer-status-modal__icon${isSuspending ? ' customer-status-modal__icon--danger' : ''}`}>
          <AlertTriangleIcon size={24} />
        </div>
        <h2 id={titleId} className="customer-status-modal__title">{title}</h2>
        <p id={descriptionId} className="customer-status-modal__description">{description}</p>
        {customer && (
          <div className="customer-status-modal__identity">
            {customerName && <strong>{customerName}</strong>}
            {customerEmail && <span>{customerEmail}</span>}
          </div>
        )}
        <div className="customer-status-modal__actions">
          <button
            ref={cancelRef}
            type="button"
            className="customer-status-modal__button customer-status-modal__button--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`customer-status-modal__button ${isSuspending ? 'customer-status-modal__button--danger' : 'customer-status-modal__button--primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

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
