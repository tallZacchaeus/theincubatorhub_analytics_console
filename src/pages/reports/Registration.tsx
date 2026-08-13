import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, UserCheck, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiErrorMessage } from '@/api/errors';
import { reportRegistration } from '@/api/endpoints/reports';
import MetricCard from '@/components/MetricCard';
import CountUp from '@/components/motion/CountUp';
import Reveal from '@/components/motion/Reveal';
import BarList from '@/components/reports/BarList';
import DateRangeControls from '@/components/reports/DateRangeControls';
import HelpHint from '@/components/HelpHint';
import PageHeader from '@/components/layout/PageHeader';
import ReportError from '@/components/reports/ReportError';
import { AXIS_TICK, GRID, TOOLTIP_STYLE, pctFromFraction } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ReportParams } from '@/types';

export default function ReportsRegistration() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);
  const reduced = useReducedMotion();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-registration', params],
    queryFn: () => reportRegistration(params ?? {}),
    enabled: params !== null,
  });

  const loading = isLoading || !data;


  // A failed request leaves `data` undefined, which would otherwise keep
  // `loading` true and render skeletons forever beneath an error banner.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Registration & acquisition"
          subtitle="Who's signing up, from where, and whether they verify."
          actions={<DateRangeControls onChange={onChange} showGranularity />}
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
        title="Registration & acquisition"
        subtitle="Who's signing up, from where, and whether they verify."
        actions={<DateRangeControls onChange={onChange} showGranularity />}
      />
      <Reveal className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiErrorMessage(error)}
          </div>
        ) : null}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)
          ) : (
            <>
              <MetricCard icon={Users} tone="green" value={<CountUp value={data.totals.signups} />} label="Signups" />
              <MetricCard icon={UserCheck} tone="blue" value={<CountUp value={data.totals.verified} />} label="Verified" />
              <MetricCard
                icon={ShieldCheck}
                tone="teal"
                value={pctFromFraction(data.totals.verification_rate)}
                label="Verification rate"
                hintTerm="consent"
              />
            </>
          )}
        </div>

        {/* Signups over time */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Signups over time</h2>
          <Card className="p-6">
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" name="Signups" stroke="#16a34a" fill="rgba(22,163,74,0.12)" strokeWidth={2} isAnimationActive={!reduced} />
                    <Line type="monotone" dataKey="secondary" name="Verified" stroke="#60a5fa" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={!reduced} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>

        {/* Acquisition by source + by programme */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-700">
              Acquisition by source
              <HelpHint term="tracked-link" />
            </div>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_source} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="source" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="signups" name="Signups" fill="#16a34a" radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                    <Bar dataKey="conversions" name="Enrolled" fill="#60a5fa" radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">By programme of interest</h2>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : (
              <BarList rows={data.by_programme.map((p) => ({ label: p.label, value: p.value }))} />
            )}
          </Card>
        </section>

        {/* Demographics */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Who's signing up</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['gender', 'age', 'top_countries'] as const).map((key) => (
              <Card key={key} className="p-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {key === 'top_countries' ? 'Top countries' : key}
                </h3>
                {loading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : (
                  <BarList
                    rows={data.demographics[key].map((d) => ({
                      label: d.label,
                      value: d.value,
                      note: `${d.value.toLocaleString()} · ${d.percentage}%`,
                    }))}
                  />
                )}
              </Card>
            ))}
          </div>
        </section>
      </Reveal>
    </>
  );
}
