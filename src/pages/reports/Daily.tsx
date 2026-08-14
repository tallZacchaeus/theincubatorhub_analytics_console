import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MousePointerClick, Percent, Target, UserCheck, Users } from 'lucide-react';
import { apiErrorMessage } from '@/api/errors';
import { reportDaily } from '@/api/endpoints/reports';
import DataTable from '@/components/DataTable';
import MetricCard from '@/components/MetricCard';
import CountUp from '@/components/motion/CountUp';
import Reveal from '@/components/motion/Reveal';
import DateRangeControls from '@/components/reports/DateRangeControls';
import PageHeader from '@/components/layout/PageHeader';
import ExportButton from '@/components/reports/ExportButton';
import ReportError from '@/components/reports/ReportError';
import { AXIS_TICK, CHART_COLORS, GRID, TOOLTIP_STYLE, pctFromFraction } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { DailyBreakdownRow, ReportParams } from '@/types';

const num = (n: number) => n.toLocaleString();

/**
 * Inline per-section export.
 *
 * This page previously built its CSVs in the browser from the data already
 * rendered. That produced files the audit log never saw, with column
 * definitions maintained separately from every other report's. It now calls the
 * same server export as the rest of the console — the placement stays, because
 * a button beside each table is better than hunting through a menu.
 */
function SectionExport({ section, params }: { section: string; params: ReportParams | null }) {
  return <ExportButton report="daily" params={params} section={section} label="Export CSV" />;
}

/** Native select styled to match the console's controls. */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
      {label}
      <select
        className="w-44 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export default function ReportsDaily() {
  const [range, setRange] = useState<ReportParams | null>(null);
  const [linkId, setLinkId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [source, setSource] = useState('');
  const reduced = useReducedMotion();
  const onChange = useCallback((p: ReportParams) => setRange(p), []);

  const params: ReportParams | null = range
    ? {
        ...range,
        ...(linkId ? { link_id: Number(linkId) } : {}),
        ...(campaignId ? { campaign_id: Number(campaignId) } : {}),
        ...(source ? { source } : {}),
      }
    : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-daily', params],
    queryFn: () => reportDaily(params ?? {}),
    enabled: params !== null,
  });
  const loading = isLoading || !data;
  const opts = data?.filter_options;

  const breakdownColumns = useMemo<ColumnDef<DailyBreakdownRow, unknown>[]>(
    () => [
      { accessorKey: 'label', header: 'Name', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.label}</span> },
      { accessorKey: 'clicks', header: 'Clicks', cell: ({ row }) => num(row.original.clicks) },
      { accessorKey: 'conversions', header: 'Conversions', cell: ({ row }) => num(row.original.conversions) },
      {
        id: 'rate',
        header: 'Conv. rate',
        accessorFn: (r) => (r.clicks > 0 ? r.conversions / r.clicks : 0),
        cell: ({ row }) => pctFromFraction(row.original.clicks > 0 ? row.original.conversions / row.original.clicks : 0),
      },
    ],
    [],
  );


  // A failed request leaves `data` undefined, which would otherwise keep
  // `loading` true and render skeletons forever beneath an error banner.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Daily analytics"
          subtitle="Signups, enrolments, link clicks, and conversions per day — drill by link, campaign, or source."
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
        title="Daily analytics"
        subtitle="Signups, enrolments, link clicks, and conversions per day — drill by link, campaign, or source."
        actions={
          <>
            <DateRangeControls onChange={onChange} showGranularity />
            <ExportButton report="daily" params={params} />
          </>
        }
      />

      <Reveal className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{apiErrorMessage(error)}</div>
        ) : null}

        {/* Drill filters */}
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Link" value={linkId} onChange={setLinkId}>
            <option value="">All links</option>
            {opts?.links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Campaign" value={campaignId} onChange={setCampaignId}>
            <option value="">All campaigns</option>
            {opts?.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Source" value={source} onChange={setSource}>
            <option value="">All sources</option>
            {opts?.sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
          {(linkId || campaignId || source) && (
            <button
              type="button"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              onClick={() => {
                setLinkId('');
                setCampaignId('');
                setSource('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)
          ) : (
            <>
              <MetricCard icon={Users} tone="green" value={<CountUp value={data.totals.signups} />} label="Signups" />
              <MetricCard icon={UserCheck} tone="blue" value={<CountUp value={data.totals.enrolments} />} label="Enrolments" />
              <MetricCard icon={MousePointerClick} tone="purple" value={<CountUp value={data.totals.clicks} />} label="Link clicks" />
              <MetricCard icon={Target} tone="orange" value={<CountUp value={data.totals.conversions} />} label="Conversions" />
              <MetricCard icon={Percent} tone="teal" value={pctFromFraction(data.totals.conversion_rate)} label="Click → conv." />
            </>
          )}
        </div>

        {/* Combined time-series */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Activity over time</h2>
            {!loading && data.series.length > 0 && (
              <SectionExport section="series" params={params} />
            )}
          </div>
          <Card className="p-6">
            {loading ? (
              <Skeleton className="h-72 rounded-xl" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {(
                      [
                        ['signups', 'Signups'],
                        ['enrolments', 'Enrolments'],
                        ['clicks', 'Clicks'],
                        ['conversions', 'Conversions'],
                      ] as const
                    ).map(([k, name], i) => (
                      <Line key={k} type="monotone" dataKey={k} name={name} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} isAnimationActive={!reduced} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>

        {/* Breakdown tables */}
        {!loading && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">By tracked link</h2>
                <SectionExport section="by_link" params={params} />
              </div>
              <DataTable columns={breakdownColumns} data={data.by_link} />
            </section>
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">By campaign</h2>
                  <SectionExport section="by_campaign" params={params} />
                </div>
                <DataTable columns={breakdownColumns} data={data.by_campaign} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">By source</h2>
                  <SectionExport section="by_source" params={params} />
                </div>
                <DataTable columns={breakdownColumns} data={data.by_source} />
              </div>
            </section>
          </>
        )}
      </Reveal>
    </>
  );
}
