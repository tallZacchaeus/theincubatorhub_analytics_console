import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Info,
  RefreshCw,
  Target,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { apiErrorMessage } from '@/api/errors';
import { reportOverview } from '@/api/endpoints/reports';
import KpiCard, { type KpiTone } from '@/components/reports/KpiCard';
import FunnelChart from '@/components/reports/FunnelChart';
import DateRangeControls from '@/components/reports/DateRangeControls';
import PageHeader from '@/components/layout/PageHeader';
import ExportButton from '@/components/reports/ExportButton';
import ReportError from '@/components/reports/ReportError';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportParams } from '@/types';

/*
 * KPI presentation metadata.
 *
 * `definition` is transcribed from ReportsService::overview() so an operator can
 * see exactly what is counted without reading PHP. Keep in sync with the service.
 *
 * Note `active_learners`: unlike every other KPI here it carries no date
 * predicate server-side, so it returns the same number for a one-day range as
 * for a one-year range. It is labelled as all-time rather than left to look like
 * it responds to the picker. Range-scoping it is a backend change (see PR notes).
 */
const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: KpiTone; definition: string; scope: string }
> = {
  signups: {
    icon: Users,
    tone: 'green',
    definition: 'Student accounts whose creation date falls inside the selected range.',
    scope: 'In selected range',
  },
  verified: {
    icon: UserCheck,
    tone: 'blue',
    definition:
      'Accounts created inside the selected range that have since verified their email address.',
    scope: 'In selected range',
  },
  kyc_complete: {
    icon: CheckCircle2,
    tone: 'teal',
    definition: 'KYC profiles marked complete inside the selected range.',
    scope: 'In selected range',
  },
  quiz_complete: {
    icon: Target,
    tone: 'purple',
    definition:
      'Distinct learners who completed the placement assessment inside the selected range.',
    scope: 'In selected range',
  },
  enrolled: {
    icon: GraduationCap,
    tone: 'orange',
    definition:
      'Distinct learners whose active or completed enrolment started inside the selected range.',
    scope: 'In selected range',
  },
  active_learners: {
    icon: BarChart3,
    tone: 'pink',
    definition:
      'Distinct learners who currently hold an active enrolment. This metric has no date filter on the server, so it reports the same all-time figure regardless of the range selected above.',
    scope: 'All time · ignores date filter',
  },
};

const nf = new Intl.NumberFormat();

/** Inclusive whole-day span of the selected range, used to label comparisons. */
function rangeDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return d.toLocaleDateString();
}

export default function ReportsOverview() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['report-overview', params],
    queryFn: () => reportOverview(params ?? {}),
    enabled: params !== null,
  });

  const comparisonLabel = useMemo(() => {
    if (!data) return 'previous period';
    const days = rangeDays(data.range.from, data.range.to);
    return `previous ${days} ${days === 1 ? 'day' : 'days'}`;
  }, [data]);

  /*
   * Executive summary.
   *
   * Derived from the funnel using the first stage as the denominator — the same
   * formula ReportsService::funnelWithConversion applies for `pct_of_accounts`,
   * so this page cannot drift from the Onboarding report. Nothing here invents a
   * metric: every rate is a ratio of two values the API already returned.
   */
  const summary = useMemo(() => {
    if (!data) return null;
    const byName = new Map(data.funnel.map((f) => [f.name, f.value]));
    const accounts = byName.get('Accounts') ?? 0;
    if (accounts === 0) return null;

    const pct = (n: number) => Math.round((n / accounts) * 1000) / 10;
    return [
      { label: 'Verification rate', value: pct(byName.get('Verified') ?? 0), of: 'reached email verification' },
      { label: 'KYC completion rate', value: pct(byName.get('KYC') ?? 0), of: 'completed KYC' },
      { label: 'Assessment rate', value: pct(byName.get('Quiz') ?? 0), of: 'completed the assessment' },
      { label: 'Enrolment rate', value: pct(byName.get('Enrolled') ?? 0), of: 'reached an enrolment' },
    ];
  }, [data]);

  const showSkeleton = isLoading || !data;

  // A failed request leaves `data` undefined, which would otherwise keep
  // `showSkeleton` true and render skeletons forever beneath the error card.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Overview"
          subtitle="Registration, onboarding and learning at a glance for the selected period."
          actions={<DateRangeControls onChange={onChange} />}
        />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <ReportError error={error} onRetry={() => void refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Registration, onboarding and learning at a glance for the selected period."
        actions={
          <>
            <DateRangeControls onChange={onChange} />
            <ExportButton report="overview" params={params} />
          </>
        }
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Data freshness + manual refresh. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500" aria-live="polite">
            {data ? (
              <>
                Data as at <span className="font-medium text-gray-700">{formatUpdated(data.generated_at)}</span>
                {isFetching ? ' · refreshing…' : ''}
              </>
            ) : (
              'Loading report…'
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={isFetching ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50 p-5" role="alert">
            <p className="text-sm font-semibold text-red-800">Could not load the overview</p>
            <p className="mt-1 text-sm text-red-700">{apiErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => void refetch()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          </Card>
        ) : null}

        {/* ---------------- Executive summary ---------------- */}
        <section aria-labelledby="exec-summary">
          <h2 id="exec-summary" className="mb-3 text-sm font-semibold text-gray-700">
            Executive summary
          </h2>
          {showSkeleton ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : summary === null ? (
            <Card className="p-6">
              <p className="text-sm text-gray-600">
                No accounts were created in this range, so conversion rates cannot be calculated.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {summary.map((s) => (
                <Card key={s.label} className="p-4">
                  <p className="text-2xl font-bold tabular-nums text-gray-950">{s.value}%</p>
                  <h3 className="mt-1 text-sm font-semibold text-gray-700">{s.label}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">of accounts {s.of}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- KPIs ---------------- */}
        <section aria-labelledby="kpis">
          <h2 id="kpis" className="mb-3 text-sm font-semibold text-gray-700">
            Key metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {showSkeleton
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-2xl" />)
              : data.kpis.map((k) => {
                  const meta = KPI_META[k.id] ?? {
                    icon: BarChart3,
                    tone: 'green' as KpiTone,
                    definition: 'No definition recorded for this metric.',
                    scope: '',
                  };
                  return (
                    <KpiCard
                      key={k.id}
                      icon={meta.icon}
                      tone={meta.tone}
                      label={k.label}
                      value={k.value}
                      definition={meta.definition}
                      scope={meta.scope}
                      delta={k.delta ? { previous: k.delta.previous, changePct: k.delta.change_pct } : null}
                      comparisonLabel={comparisonLabel}
                    />
                  );
                })}
          </div>
          {!showSkeleton && data.kpis.some((k) => !k.delta) ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Only Signups is returned with a previous-period comparison by the reports API today.
                The remaining metrics show no delta rather than an assumed one.
              </span>
            </p>
          ) : null}
        </section>

        {/* ---------------- Funnel ---------------- */}
        <section aria-labelledby="funnel">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="funnel" className="text-sm font-semibold text-gray-700">
              Onboarding funnel
            </h2>
            {!showSkeleton && data.funnel.length > 0 ? (
              <p className="text-xs text-gray-500">
                {nf.format(data.funnel[0].value)} accounts entered this period
              </p>
            ) : null}
          </div>
          <Card className="p-5 sm:p-6">
            {showSkeleton ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <>
                <FunnelChart stages={data.funnel} />
                {/*
                  Honesty note: each stage counts events that occurred inside the
                  range, not one cohort tracked through the stages, so a learner
                  who signed up before the range can still land in a later stage.
                */}
                <p className="mt-4 flex items-start gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Each stage counts activity that happened during this period, not a single cohort
                    followed through the funnel. Learners who signed up earlier can appear in a later
                    stage, so step percentages are directional rather than exact cohort conversion.
                  </span>
                </p>
              </>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
