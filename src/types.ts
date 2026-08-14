// --- Admin analytics reports (Phase 3/4) ---
export interface ReportRange {
  from: string;
  to: string;
}
export interface ReportKpi {
  id: string;
  label: string;
  value: number;
  delta: { previous: number; change_pct: number | null } | null;
}
export interface DemographicRow {
  label: string;
  value: number;
  percentage: number;
}
export interface ReportOverview {
  range: ReportRange;
  kpis: ReportKpi[];
  funnel: { name: string; value: number }[];
  generated_at: string;
}
export interface ReportRegistration {
  range: ReportRange;
  granularity: string;
  totals: { signups: number; verified: number; verification_rate: number };
  series: { date: string; value: number; secondary: number }[];
  by_source: { source: string; signups: number; conversions: number }[];
  by_programme: { label: string; value: number }[];
  demographics: { gender: DemographicRow[]; age: DemographicRow[]; top_countries: DemographicRow[] };
  generated_at: string;
}
export interface ReportOnboarding {
  range: ReportRange;
  funnel: {
    name: string;
    value: number;
    pct_of_accounts: number;
    step_conversion: number | null;
    dropoff: number | null;
  }[];
  time_to_stage: { transition: string; count: number; median_hours: number; p90_hours: number }[];
  quiz: {
    generated: number;
    submitted: number;
    completed: number;
    fallback_rate: number;
    laptop_access: { yes: number; no: number; sometimes: number };
  };
  recommendation_acceptance_rate: number | null;
  generated_at: string;
}

export interface ReportLearning {
  range: ReportRange;
  enrolments_by_status: Record<string, number>;
  by_programme: { label: string; value: number }[];
  cohort_health: {
    cohort_id: number;
    name: string;
    status: string;
    capacity: number | null;
    seats_taken: number;
    fill_rate: number | null;
    active: number;
    completed: number;
  }[];
  attendance: { overall_rate: number; sessions_recorded: number; by_cohort: { label: string; value: number }[] };
  completion: { completed: number; completion_rate: number; median_days_to_complete: number };
  certificates: { total_issued: number; revoked: number; series: { date: string; value: number }[] };
  generated_at: string;
}

export interface ReportParams {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
  link_id?: number;
  campaign_id?: number;
  source?: string;
}

export interface DailyBreakdownRow {
  key: string;
  label: string;
  clicks: number;
  conversions: number;
}
export interface ReportDaily {
  range: ReportRange;
  granularity: string;
  filters: { link_id: number | null; campaign_id: number | null; source: string | null };
  totals: { signups: number; enrolments: number; clicks: number; conversions: number; conversion_rate: number };
  series: { date: string; signups: number; enrolments: number; clicks: number; conversions: number }[];
  by_link: DailyBreakdownRow[];
  by_campaign: DailyBreakdownRow[];
  by_source: DailyBreakdownRow[];
  filter_options: {
    links: { id: number; label: string }[];
    campaigns: { id: number; name: string }[];
    sources: string[];
  };
  generated_at: string;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface Contact {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  consent_marketing: boolean;
  consent_source: string | null;
  matched_user_id: number | null;
  created_at: string | null;
}

export interface ImportSummary {
  import_id: string;
  status: string;
  total_rows?: number;
  imported?: number;
  duplicates_in_file?: number;
  duplicates_existing?: number;
  suppressed?: number;
  invalid?: number;
  errors?: { row: number; email: string | null; error: string }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  audience_type: 'contacts' | 'app_users' | 'mixed';
  filter_definition: Record<string, unknown>;
  contacts_count: number | null;
  created_at: string | null;
}

export interface FilterOptions {
  audience_types: string[];
  app_user_stages: { key: string; label: string; description: string; actionable: boolean }[];
  app_user_filters: Record<string, string[]>;
}

export interface PreviewCount {
  category_id: number;
  audience_type: string;
  count: number;
  breakdown: { app_users: number; contacts: number; total: number };
}

export interface Template {
  id: number;
  name: string;
  subject: string;
  html_body: string | null;
  text_body: string | null;
  variables: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface RenderedPreview {
  subject: string;
  html: string;
  text: string | null;
  sample: Record<string, string>;
}

export interface Broadcast {
  id: number;
  name: string | null;
  status: string;
  subject: string;
  from: { name: string | null; email: string | null };
  template: { id: number | null; name: string | null };
  category: { id: number | null; name: string | null };
  cost: number | string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string | null;
}

export interface TrackedLink {
  id: number;
  label: string | null;
  link_type: 'acquisition' | 'reengagement' | 'referral';
  destination_url: string;
  short_token: string;
  tracked_url: string;
  capture_url: string;
  marketing_campaign_id: number | null;
  marketing_category_id: number | null;
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null };
  click_count: number;
  /** Conversions attributed to this link (signups). Added in the analytics-console phase. */
  conversions?: number;
  last_clicked_at?: string | null;
  created_at: string | null;
}

export interface LinkAnalytics {
  link: {
    id: number;
    label: string | null;
    link_type: string;
    destination_url: string;
    tracked_url: string;
    utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null };
    created_at: string | null;
  };
  totals: { clicks: number; conversions: number; conversion_rate: number };
  clicks_series: { date: string; clicks: number }[];
  top_referers: { referer: string; clicks: number }[];
}

export interface CampaignAnalytics {
  campaign: { id: number; name: string | null; status: string; sent_at: string | null; cost: number | null };
  summary: {
    recipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
    failed: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
  };
  conversions: { count: number; cost: number | null; cost_per_conversion: number | null };
  links: {
    id: number;
    label: string | null;
    link_type: string;
    destination_url: string;
    marketing_category_id: number | null;
    clicks: number;
    conversions: number;
  }[];
  generated_at: string;
}

/*
 * Signup-cohort report.
 *
 * Learners grouped by when they signed up, so every cohort is given the same
 * amount of time to convert and periods are comparable. This is what replaces
 * the pooled all-time conversion rate, which mixed a learner who signed up this
 * morning with one from three months ago.
 */
export interface CohortStage {
  key: string;
  label: string;
  count: number;
  pct_of_cohort: number;
  step_conversion: number | null;
  median_hours_to_reach: number | null;
  /*
   * Keyed by window length in days. `null` means the cohort is younger than
   * that window and has not had the chance to convert — NOT that nobody did.
   * Render it as an em dash, never as 0%.
   */
  reached_within_days: Record<string, number | null>;
}

export interface Cohort {
  cohort: string;
  label: string;
  size: number;
  age_days: number;
  stages: CohortStage[];
}

export interface ReportCohorts {
  range: ReportRange;
  granularity: 'day' | 'week' | 'month';
  windows_days: number[];
  cohorts: Cohort[];
  notes: string[];
  generated_at: string;
}

/** One course's funnel, from the per-course report. */
export interface CourseRow {
  course_id: number;
  name: string;
  slug: string;
  status: string;
  programme: string | null;
  level: string | null;
  device_requirement: string | null;
  enrolled: number;
  pending: number;
  active: number;
  completed: number;
  withdrawn: number;
  failed: number;
  certificates: number;
  /** Null when nothing enrolled in range — a course with no intake has no rate. */
  start_rate: number | null;
  completion_rate: number | null;
}

export interface ReportCourses {
  range: ReportRange;
  courses: CourseRow[];
  totals: { courses: number; with_enrolments: number; enrolled: number; completed: number };
  notes: string[];
  generated_at: string;
}
