import { apiClient } from '@/api/client';
import type {
  ReportCohorts,
  ReportCourses,
  ReportDaily,
  ReportLearning,
  ReportOnboarding,
  ReportOverview,
  ReportParams,
  ReportRegistration,
} from '@/types';

const BASE = '/api/admin/reports';

export async function reportDaily(params: ReportParams = {}): Promise<ReportDaily> {
  const { data } = await apiClient.get(`${BASE}/daily`, { params });
  return data.data;
}

export async function reportOverview(params: ReportParams = {}): Promise<ReportOverview> {
  const { data } = await apiClient.get(`${BASE}/overview`, { params });
  return data.data;
}

export async function reportRegistration(params: ReportParams = {}): Promise<ReportRegistration> {
  const { data } = await apiClient.get(`${BASE}/registration`, { params });
  return data.data;
}

export async function reportOnboarding(params: ReportParams = {}): Promise<ReportOnboarding> {
  const { data } = await apiClient.get(`${BASE}/onboarding`, { params });
  return data.data;
}

export async function reportLearning(params: ReportParams = {}): Promise<ReportLearning> {
  const { data } = await apiClient.get(`${BASE}/learning`, { params });
  return data.data;
}

export async function reportCohorts(params: ReportParams = {}): Promise<ReportCohorts> {
  const { data } = await apiClient.get(`${BASE}/cohorts`, { params });
  return data.data;
}

/** Which tables each report can produce, mirroring ReportExportService::SECTIONS. */
export async function reportCourses(params: ReportParams = {}): Promise<ReportCourses> {
  const { data } = await apiClient.get(`${BASE}/courses`, { params });
  return data.data;
}

export const REPORT_SECTIONS = {
  overview: [
    { value: 'kpis', label: 'Headline metrics' },
    { value: 'funnel', label: 'Funnel stages' },
  ],
  registration: [
    { value: 'series', label: 'Signups over time' },
    { value: 'by_source', label: 'Acquisition source' },
    { value: 'by_programme', label: 'Programme of interest' },
    { value: 'demographics', label: 'Demographics' },
  ],
  onboarding: [
    { value: 'funnel', label: 'Funnel with step conversion' },
    { value: 'time_to_stage', label: 'Time to reach each stage' },
  ],
  learning: [
    { value: 'cohort_health', label: 'Cohort health' },
    { value: 'by_programme', label: 'Enrolments by programme' },
    { value: 'enrolments_by_status', label: 'Enrolments by status' },
    { value: 'attendance', label: 'Attendance by cohort' },
    { value: 'certificates', label: 'Certificates issued over time' },
  ],
  cohorts: [{ value: 'cohorts', label: 'Signup cohorts by stage' }],
  courses: [{ value: 'courses', label: 'Per-course funnel' }],
  daily: [
    { value: 'series', label: 'Daily activity' },
    { value: 'by_link', label: 'By tracked link' },
    { value: 'by_campaign', label: 'By campaign' },
    { value: 'by_source', label: 'By source' },
  ],
} as const;

export type ReportName = keyof typeof REPORT_SECTIONS;

/**
 * Download one table from a report as CSV.
 *
 * Takes the same params object the page passed to the report itself, so the
 * file matches what is on screen rather than re-deriving its own filters — the
 * mistake the student export made when it sent only the search term.
 */
export async function exportReport(
  report: ReportName,
  section: string,
  params: ReportParams = {},
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get(`${BASE}/${report}/export`, {
    params: { ...params, section },
    responseType: 'blob',
  });

  // Prefer the server's filename (it carries the report, section and a
  // timestamp) so two downloads never collide in the Downloads folder.
  const disposition = String(response.headers['content-disposition'] ?? '');
  const match = disposition.match(/filename="?([^";]+)"?/i);

  return {
    blob: response.data as Blob,
    filename: match?.[1] ?? `${report}-${section}.csv`,
  };
}

/** Funnel stages a learner segment can be built from (mirrors StudentEvent::FUNNEL). */
export const FUNNEL_STAGES = [
  { key: 'signed_up', label: 'Signed up' },
  { key: 'verified', label: 'Verified email' },
  { key: 'kyc', label: 'Completed KYC' },
  { key: 'quiz', label: 'Completed quiz' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'activated', label: 'Started learning' },
] as const;

/**
 * Download the learners in a segment — the people behind a funnel number.
 *
 * `notReached` turns "everyone who reached this stage" into the drop-off list,
 * which is the actionable one: reached KYC but never took the quiz.
 */
export async function exportLearnerSegment(
  reached: string,
  notReached: string | null,
  params: ReportParams = {},
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get(`${BASE}/learners/export`, {
    params: {
      from: params.from,
      to: params.to,
      reached,
      ...(notReached ? { not_reached: notReached } : {}),
    },
    responseType: 'blob',
  });

  const disposition = String(response.headers['content-disposition'] ?? '');
  const match = disposition.match(/filename="?([^";]+)"?/i);

  return {
    blob: response.data as Blob,
    filename: match?.[1] ?? `learners-${reached}.csv`,
  };
}
