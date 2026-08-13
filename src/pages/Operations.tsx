import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Loader2, Users } from 'lucide-react';
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
import { apiErrorMessage } from '@/api/errors';
import { exportCsv, operationsOverview, saveActivity, saveChecklist } from '@/api/endpoints/operations';
import { useAuth } from '@/auth/AuthContext';
import DataTable from '@/components/DataTable';
import MetricCard, { type MetricTone } from '@/components/MetricCard';
import CountUp from '@/components/motion/CountUp';
import Reveal from '@/components/motion/Reveal';
import BarList from '@/components/reports/BarList';
import PageHeader from '@/components/layout/PageHeader';
import ReportError from '@/components/reports/ReportError';
import { AXIS_TICK, CHART_COLORS, GRID, TOOLTIP_STYLE, pctFromPercent } from '@/content/chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { AgentActivityInput, OpsAgentRow, OpsAgentStatus, OpsTarget } from '@/types-ops';

const STATUS: Record<OpsAgentStatus, { label: string; cls: string }> = {
  on_target: { label: 'On target', cls: 'bg-green-100 text-green-700' },
  behind: { label: 'Behind', cls: 'bg-orange-100 text-orange-700' },
  at_risk: { label: 'At risk', cls: 'bg-red-100 text-red-700' },
};

function PaceBadge({ status }: { status: OpsAgentStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

const num = (n: number) => n.toLocaleString();

export default function Operations() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const [date, setDate] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operations', date],
    queryFn: () => operationsOverview(date || undefined),
  });
  const loading = isLoading || !data;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['operations'] });
  }

  // --- Activity form (prime from my_activity) ---
  const [form, setForm] = useState<AgentActivityInput>({
    emails_sent: 0,
    whatsapp_calls: 0,
    opens: 0,
    clicks: 0,
    conversions: 0,
    segment: '',
    notes: '',
  });
  useEffect(() => {
    if (data?.my_activity) {
      const a = data.my_activity;
      setForm({
        emails_sent: a.emails_sent,
        whatsapp_calls: a.whatsapp_calls,
        opens: a.opens,
        clicks: a.clicks,
        conversions: a.conversions,
        segment: a.segment ?? '',
        notes: a.notes ?? '',
      });
    }
  }, [data?.my_activity]);

  const activityMut = useMutation({
    mutationFn: () => saveActivity({ ...form, date: date || undefined }),
    onSuccess: () => {
      toast.success('Activity saved');
      invalidate();
    },
    onError: (e) => toast.error(e),
  });

  const checklistMut = useMutation({
    mutationFn: (checked: Record<string, boolean>) => saveChecklist(checked, date || undefined),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  function toggleChecklist(key: string, value: boolean) {
    if (!data) return;
    const checked: Record<string, boolean> = {};
    for (const g of data.checklist.groups) for (const i of g.items) checked[i.key] = i.checked;
    checked[key] = value;
    checklistMut.mutate(checked);
  }

  const exportMut = useMutation({
    mutationFn: () => exportCsv(date || undefined),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-operations-${data?.date ?? 'today'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => toast.error(e),
  });

  const targetColumns = useMemo<ColumnDef<OpsTarget, unknown>[]>(
    () => [
      { accessorKey: 'label', header: 'Stage', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.label}</span> },
      { id: 'current', header: 'Current', accessorFn: (r) => (r.current ?? 0).toLocaleString() },
      { id: 'goal', header: 'Goal', accessorFn: (r) => (r.goal != null ? r.goal.toLocaleString() : '—') },
      { id: 'gap', header: 'Gap', accessorFn: (r) => (r.gap != null ? r.gap.toLocaleString() : '—') },
      { accessorKey: 'daily_target', header: 'Daily target', cell: ({ row }) => num(row.original.daily_target) },
      { accessorKey: 'actual_today', header: 'Today', cell: ({ row }) => num(row.original.actual_today) },
      { id: 'pace', header: 'Pace', enableSorting: false, cell: ({ row }) => <PaceBadge status={row.original.pace_status} /> },
    ],
    [],
  );

  const agentColumns = useMemo<ColumnDef<OpsAgentRow, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Agent', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.name}</span> },
      { id: 'segment', header: 'Segment', accessorFn: (r) => r.segment ?? '—' },
      { accessorKey: 'emails_sent', header: 'Emails', cell: ({ row }) => num(row.original.emails_sent) },
      { accessorKey: 'whatsapp_calls', header: 'WhatsApp', cell: ({ row }) => num(row.original.whatsapp_calls) },
      { accessorKey: 'opens', header: 'Opens', cell: ({ row }) => num(row.original.opens) },
      { accessorKey: 'clicks', header: 'Clicks', cell: ({ row }) => num(row.original.clicks) },
      { accessorKey: 'conversions', header: 'Conv.', cell: ({ row }) => num(row.original.conversions) },
      { id: 'pct', header: '% target', accessorFn: (r) => `${r.pct_of_target}%` },
      { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <PaceBadge status={row.original.status} /> },
    ],
    [],
  );

  const totalsTiles: { label: string; key: keyof NonNullable<typeof data>['totals']; tone: MetricTone }[] = [
    { label: 'Accounts', key: 'accounts', tone: 'green' },
    { label: 'KYC', key: 'kyc', tone: 'blue' },
    { label: 'Quiz', key: 'quiz', tone: 'purple' },
    { label: 'Enrolled', key: 'enrolled', tone: 'orange' },
    { label: 'Active', key: 'active', tone: 'teal' },
  ];

  // A failed request leaves `data` undefined, which would otherwise keep
  // `loading` true and render skeletons forever beneath an error banner.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Daily operations"
          subtitle="Sprint funnel, daily targets, pace, and team activity."
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
        title="Daily operations"
        subtitle={
          data
            ? `Sprint ${data.sprint.starts_on} → ${data.sprint.ends_on} · ${data.sprint.days_remaining} days left`
            : 'Sprint funnel, daily targets, pace, and team activity.'
        }
        actions={
          <>
            <Input type="date" className="w-40 rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
            {isAdmin ? (
              <Button variant="outline" onClick={() => exportMut.mutate()} disabled={exportMut.isPending}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            ) : null}
          </>
        }
      />

      <Reveal className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiErrorMessage(error)}
          </div>
        ) : null}

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)
            : totalsTiles.map((t) => (
                <MetricCard key={t.key} icon={Users} tone={t.tone} value={<CountUp value={data.totals[t.key]} />} label={t.label} />
              ))}
        </div>

        {/* Funnel + conversion rates */}
        {!loading && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Onboarding funnel</h2>
              <BarList rows={data.funnel.map((f) => ({ label: f.name, value: f.value, note: `${num(f.value)} · ${f.pct}%` }))} />
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Stage-to-stage conversion</h2>
              <div className="space-y-3">
                {data.conversion_rates.map((c) => (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{c.label}</span>
                    <span className="tabular-nums text-gray-900">
                      {pctFromPercent(c.rate)} <span className="text-gray-400">· {num(c.from)}→{num(c.to)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Backlog */}
        {!loading && data.backlog.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Current backlog by stage</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {data.backlog.map((b) => (
                <Card key={b.key} className="p-5">
                  <div className="text-2xl font-bold text-gray-950">{num(b.count)}</div>
                  <div className="mt-1 text-xs text-gray-500">{b.label}</div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Daily targets */}
        {!loading && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Daily targets</h2>
            <DataTable columns={targetColumns} data={data.targets} />
          </section>
        )}

        {/* Projection */}
        {!loading && data.projection.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Pace &amp; projected finish</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.projection.map((p) => (
                <Card key={p.key} className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{p.label}</span>
                    <PaceBadge status={p.will_finish_in_time ? 'on_target' : p.off_pace ? 'at_risk' : 'behind'} />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{p.trailing_rate_per_day.toFixed(1)}/day · gap {num(p.gap)}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {p.projected_finish ? `Projected ${p.projected_finish}` : 'No recent progress'}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trend */}
        {!loading && data.trend.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Trend (last 30 days)</h2>
            <Card className="p-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {(['accounts', 'kyc', 'quiz', 'enrolled'] as const).map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} isAnimationActive={!reduced} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>
        )}

        {/* Course snapshot + running totals */}
        {!loading && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Course enrolment snapshot</h2>
              <BarList rows={data.course_snapshot.courses.map((c) => ({ label: c.name, value: c.enrolments, note: `${num(c.enrolments)} · ${c.pct}%` }))} />
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Running totals</h2>
              <div className="space-y-2 text-sm">
                {data.running_totals.map((r) => (
                  <div key={r.key} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-0">
                    <span className="text-gray-600">{r.label}</span>
                    <span className="tabular-nums text-gray-900">
                      {num(r.cumulative)}
                      {r.target != null ? <span className="text-gray-400"> / {num(r.target)}</span> : null}
                      <span className="ml-2 text-green-700">+{num(r.today)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* My activity (write) */}
        {!loading && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">My activity today</h2>
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {(
                  [
                    ['emails_sent', 'Emails sent'],
                    ['whatsapp_calls', 'WhatsApp'],
                    ['opens', 'Opens'],
                    ['clicks', 'Clicks'],
                    ['conversions', 'Conversions'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="text-xs text-gray-500">
                      {label}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      min={0}
                      className="rounded-xl"
                      value={form[key] as number}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label htmlFor="segment" className="text-xs text-gray-500">
                    Segment
                  </Label>
                  <Input id="segment" className="rounded-xl" value={form.segment ?? ''} onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))} />
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="notes" className="text-xs text-gray-500">
                  Notes
                </Label>
                <Textarea id="notes" rows={2} className="rounded-xl" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="mt-4">
                <Button onClick={() => activityMut.mutate()} disabled={activityMut.isPending}>
                  {activityMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save activity
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Checklist (write) */}
        {!loading && data.checklist.groups.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Daily reporting checklist</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.checklist.groups.map((g) => (
                <Card key={g.key} className="p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.label}</h3>
                  <div className="space-y-2.5">
                    {g.items.map((item) => (
                      <label key={item.key} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(v) => toggleChecklist(item.key, Boolean(v))}
                          className="mt-0.5"
                        />
                        <span className="text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Team (admin only) */}
        {!loading && data.team ? (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Team accountability</h2>
              <DataTable columns={agentColumns} data={data.team.agents} />
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Leaderboard</h2>
              <Card className="p-6">
                <BarList
                  rows={data.team.leaderboard.map((l) => ({
                    label: l.name,
                    value: l.conversions,
                    note: `${num(l.conversions)} conv · ${l.conversions_per_100}/100 emails`,
                  }))}
                />
              </Card>
            </section>
          </>
        ) : null}
      </Reveal>
    </>
  );
}
