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
import { Download, MousePointerClick, Percent, Target, UserCheck, Users } from 'lucide-react';
import { apiErrorMessage } from '@/api/errors';
import { reportDaily } from '@/api/endpoints/reports';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import MetricCard from '@/components/MetricCard';
import CountUp from '@/components/motion/CountUp';
import Reveal from '@/components/motion/Reveal';
import DateRangeControls from '@/components/reports/DateRangeControls';
import PageHeader from '@/components/layout/PageHeader';
import { AXIS_TICK, CHART_COLORS, GRID, TOOLTIP_STYLE, pct } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { DailyBreakdownRow, ReportParams } from '@/types';

const num = (n: number) => n.toLocaleString();

const BREAKDOWN_COLS = [
  { key: 'label' as const, header: 'Name' },
  { key: 'clicks' as const, header: 'Clicks' },
  { key: 'conversions' as const, header: 'Conversions' },
];

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} aria-label="Export CSV">
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
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

  const { data, isLoading, error } = useQuery({
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
        cell: ({ row }) => pct(row.original.clicks > 0 ? row.original.conversions / row.original.clicks : 0),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Daily analytics"
        subtitle="Signups, enrolments, link clicks, and conversions per day — drill by link, campaign, or source."
        actions={<DateRangeControls onChange={onChange} showGranularity />}
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
              <MetricCard icon={Percent} tone="teal" value={pct(data.totals.conversion_rate)} label="Click → conv." />
            </>
          )}
        </div>

        {/* Combined time-series */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Activity over time</h2>
            {!loading && data.series.length > 0 && (
              <ExportButton
                onClick={() =>
                  downloadCsv(`daily-series-${data.range.from.slice(0, 10)}_${data.range.to.slice(0, 10)}`, data.series, [
                    { key: 'date', header: 'Date' },
                    { key: 'signups', header: 'Signups' },
                    { key: 'enrolments', header: 'Enrolments' },
                    { key: 'clicks', header: 'Clicks' },
                    { key: 'conversions', header: 'Conversions' },
                  ])
                }
              />
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
                <ExportButton onClick={() => downloadCsv('daily-by-link', data.by_link, BREAKDOWN_COLS)} />
              </div>
              <DataTable columns={breakdownColumns} data={data.by_link} />
            </section>
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">By campaign</h2>
                  <ExportButton onClick={() => downloadCsv('daily-by-campaign', data.by_campaign, BREAKDOWN_COLS)} />
                </div>
                <DataTable columns={breakdownColumns} data={data.by_campaign} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">By source</h2>
                  <ExportButton onClick={() => downloadCsv('daily-by-source', data.by_source, BREAKDOWN_COLS)} />
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
