import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportOnboarding } from '@/api/endpoints/reports';
import Reveal from '@/components/motion/Reveal';
import BarList from '@/components/reports/BarList';
import DateRangeControls from '@/components/reports/DateRangeControls';
import HelpHint from '@/components/HelpHint';
import PageHeader from '@/components/layout/PageHeader';
import ExportButton from '@/components/reports/ExportButton';
import ReportError from '@/components/reports/ReportError';
import { hours, pctFromFraction } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportParams } from '@/types';

export default function ReportsOnboarding() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-onboarding', params],
    queryFn: () => reportOnboarding(params ?? {}),
    enabled: params !== null,
  });

  const loading = isLoading || !data;

  // A failed request leaves `data` undefined, which would otherwise keep
  // `loading` true and render skeletons forever beneath an error banner.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Onboarding"
          subtitle="Where people drop off between signup and enrolment, and how long each stage takes."
          actions={<DateRangeControls onChange={onChange} />}
        />
        <Reveal className="px-4 py-6 sm:px-6 lg:px-8">
          <ReportError error={error} onRetry={() => void refetch()} />
        </Reveal>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Onboarding"
        subtitle="Where people drop off between signup and enrolment, and how long each stage takes."
        actions={
          <>
            <DateRangeControls onChange={onChange} />
            <ExportButton report="onboarding" params={params} />
          </>
        }
      />
      <Reveal className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Funnel with step conversion */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Funnel — accounts to enrolled</h2>
          <Card className="p-6">
            {loading ? (
              <Skeleton className="h-44 rounded-xl" />
            ) : (
              <BarList
                rows={data.funnel.map((f) => ({
                  label: f.name,
                  value: f.value,
                  note:
                    f.step_conversion !== null
                      ? `${f.value.toLocaleString()} · ${f.step_conversion}% of prev`
                      : `${f.value.toLocaleString()} · ${f.pct_of_accounts}%`,
                }))}
              />
            )}
          </Card>
        </section>

        {/* Time to stage */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-1 text-sm font-semibold text-gray-700">
            Time to complete each stage
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              : data.time_to_stage.map((t) => (
                  <Card key={t.transition} className="p-5">
                    <div className="text-sm font-semibold text-gray-900">{t.transition}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-950">{hours(t.median_hours)}</span>
                      <span className="text-xs text-gray-500">median</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      p90 {hours(t.p90_hours)} · {t.count.toLocaleString()} people
                    </div>
                  </Card>
                ))}
          </div>
        </section>

        {/* Quiz quality */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Quiz</h2>
            {loading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Generated', value: data.quiz.generated },
                    { label: 'Submitted', value: data.quiz.submitted },
                    { label: 'Completed', value: data.quiz.completed },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                      <div className="text-xl font-bold text-gray-950">{s.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  AI fallback used on {pctFromFraction(data.quiz.fallback_rate)} of generated quizzes.
                </p>
              </>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-700">
              Laptop access (eligibility)
            </h2>
            {loading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : (
              <BarList
                color="#60a5fa"
                rows={[
                  { label: 'Yes', value: data.quiz.laptop_access.yes },
                  { label: 'Sometimes', value: data.quiz.laptop_access.sometimes },
                  { label: 'No', value: data.quiz.laptop_access.no },
                ]}
              />
            )}
          </Card>
        </section>

        {/* Recommendation acceptance */}
        {!loading && data.recommendation_acceptance_rate !== null ? (
          <Card className="flex items-center justify-between p-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              Recommendation acceptance rate
              <HelpHint term="conversion" />
            </div>
            <span className="text-2xl font-bold text-gray-950">{pctFromFraction(data.recommendation_acceptance_rate)}</span>
          </Card>
        ) : null}
      </Reveal>
    </>
  );
}
