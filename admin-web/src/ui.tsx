import { ReactNode } from 'react';
import { ApiError } from './api';

// Shows the right screen for loading, error (404 means the feature is missing), empty, or the real content.
export function State({ loading, error, empty, emptyText, retry, children }:
  { loading: boolean; error?: ApiError; empty?: boolean; emptyText?: string; retry?: () => void; children: ReactNode }) {
  if (loading) return <div className="state" role="status">Loading…</div>;
  if (error?.status === 404) return <div className="state">This feature isn't available from the API yet.</div>;
  if (error) return <div className="state err" role="alert">{error.message}{retry && <button className="btn ghost" onClick={retry}>Try again</button>}</div>;
  if (empty) return <div className="state">{emptyText ?? 'Nothing here yet.'}</div>;
  return <>{children}</>;
}
// Label and input wrapper that also shows a validation message under the input.
export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) =>
  <label className="field"><span>{label}</span>{children}{error && <small className="ferr">{error}</small>}</label>;
// Rating shown as a star and one decimal, like 4.9.
export const Stars = ({ n }: { n: number }) => <span className="star">★ {n.toFixed(1)}</span>;
// Formats prices in Pula, e.g. P1,250.
export const fmtP = (n: number) => 'P' + Math.round(n).toLocaleString();
