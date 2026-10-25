import { apiFetch } from './api';
import type { Rating, Report, ReportStatus } from '../types';

export async function getReports(status?: ReportStatus): Promise<{ reports: Report[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ reports: Report[] }>(`/reports${query}`);
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<{ report: Report }> {
  return apiFetch<{ report: Report }>(`/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getAllRatings(): Promise<{ ratings: Rating[] }> {
  return apiFetch<{ ratings: Rating[] }>('/admin/ratings');
}

export async function deleteRating(id: string): Promise<void> {
  return apiFetch<void>(`/admin/ratings/${id}`, {
    method: 'DELETE',
  });
}
