import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { reportCohorts } from '@/api/endpoints/reports';
import Reveal from '@/components/motion/Reveal';
import DateRangeControls from '@/components/reports/DateRangeControls';
import PageHeader from '@/components/layout/PageHeader';
import ExportButton from '@/components/reports/ExportButton';
import SegmentDownload from '@/components/reports/SegmentDownload';
import ReportError from '@/components/reports/ReportError';
import { hours, pctFromPercent } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cohort, CohortStage, ReportParams } from '@/types';

const nf = new Intl.NumberFormat();

/**
 * Colour by how well a stage retained the cohort. Deliberately coarse — three
 * bands, not a gradient — so the eye lands on the worst row rather than trying
 * to rank twenty similar shades.
 */
function toneFor(pct: number): string {
  if (pct >= 75) return 'bg-green-50 text-green-800';
  if (pct >= 40) return 'bg-amber-50 text-amber-800';
  return 'bg-red-50 text-red-800';
}

/**
 * A window figure the cohort hasn't lived long enough to earn.
 *
 * The API sends null rather than 0 for these, and rendering it as "—" with an
 * explanation is the whole point: a four-day-old cohort showing "2% enrolled
 * within 30 days" would read as a catastrophe when it actually means "ask again
 * in a month".
 */
function WindowCell({ value, size, days, age }: { value: number | null; size: number; days: number; age: number }) {
  if (value === null) {
    return (
      <span
        className="text-gray-400"
        title={`This cohort is ${age} days old, so it has not had ${days} days to convert yet.`}
      >
        —
      </span>
    );
  }

  return (
    <span className="tabular-nums">
      {nf.format(value)}
      <span className="ml-1 text-xs text-gray-500">({size > 0 ? Math.round((value / size) * 100) : 0}%)</span>
    </span>
  );
}

function CohortCard({ cohort, windows }: { cohort: Cohort; windows: number[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{cohort.label}</h3>
          <p className="text-xs text-gray-500">
            {nf.format(cohort.size)} signed up · {cohort.age_days} days ago
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th scope="col" className="px-5 py-2 font-medium">Stage</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Reached</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">% of cohort</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Median time</th>
              {windows.map((d) => (
                <th key={d} scope="col" className="px-3 py-2 text-right font-medium">
                  ≤ {d}d
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohort.stages.map((stage: CohortStage) => (
              <tr key={stage.key} className="border-b border-gray-100 last:border-0">
                <th scope="row" className="px-5 py-2.5 text-left font-medium text-gray-900">
                  {stage.label}
                </th>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{nf.format(stage.count)}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${toneFor(stage.pct_of_cohort)}`}>
                    {pctFromPercent(stage.pct_of_cohort)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                  {stage.median_hours_to_reach === null ? '—' : hours(stage.median_hours_to_reach)}
                </td>
                {windows.map((d) => (
                  <td key={d} className="px-3 py-2.5 text-right text-gray-700">
                    <WindowCell
                      value={stage.reached_within_days[String(d)] ?? null}
                      size={cohort.size}
                      days={d}
                      age={cohort.age_days}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ReportsCohorts() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-cohorts', params],
    queryFn: () => reportCohorts(params ?? {}),
    enabled: params !== null,
  });

  const loading = isLoading || !data;

  const header = (
    <PageHeader
      title="Cohorts"
      subtitle="How each intake progresses after signup, and how fast — cohorts compared like for like."
      actions={
        <>
          <DateRangeControls onChange={onChange} showGranularity />
          <ExportButton report="cohorts" params={params} />
          <SegmentDownload params={params} />
        </>
      }
    />
  );

  if (error && !data) {
    return (
      <>
        {header}
        <Reveal className="px-4 py-6 sm:px-6 lg:px-8">
          <ReportError error={error} onRetry={() => void refetch()} />
        </Reveal>
      </>
    );
  }

  return (
    <>
      {header}
      <Reveal className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="flex gap-3 border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">Why these numbers differ from the Overview funnel</p>
            <p className="mt-1">
              Each row is measured against <strong>its own cohort</strong>, so a big month cannot drag another
              month's rate around. Every cohort is also given the same number of days to convert, which the
              pooled all-time rate on the Overview page does not do.
            </p>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : data.cohorts.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">No signups in this period</p>
            <p className="mt-1 text-sm text-gray-500">Widen the date range to see cohorts.</p>
          </Card>
        ) : (
          <>
            {data.cohorts.map((cohort) => (
              <CohortCard key={cohort.cohort} cohort={cohort} windows={data.windows_days} />
            ))}

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-700">How to read this</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                {data.notes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    <span>{note}</span>
                  </li>
                ))}
                <li className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>
                    A dash in a window column means the cohort is younger than that window — hover it for the
                    cohort's age. It is not a zero.
                  </span>
                </li>
              </ul>
            </Card>
          </>
        )}
      </Reveal>
    </>
  );
}
