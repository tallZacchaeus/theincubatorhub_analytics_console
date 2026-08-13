import { apiClient } from '@/api/client';
import type {
  ReportCohorts,
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
