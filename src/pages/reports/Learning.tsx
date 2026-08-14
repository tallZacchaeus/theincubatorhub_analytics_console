import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Award, CalendarCheck, GraduationCap, Percent } from 'lucide-react';
import { apiErrorMessage } from '@/api/errors';
import { reportLearning } from '@/api/endpoints/reports';
import DataTable from '@/components/DataTable';
import MetricCard from '@/components/MetricCard';
import CountUp from '@/components/motion/CountUp';
import Reveal from '@/components/motion/Reveal';
import BarList from '@/components/reports/BarList';
import DateRangeControls from '@/components/reports/DateRangeControls';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/layout/PageHeader';
import ExportButton from '@/components/reports/ExportButton';
import ReportError from '@/components/reports/ReportError';
import { pctFromFraction } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportLearning, ReportParams } from '@/types';

type CohortRow = ReportLearning['cohort_health'][number];

const cohortColumns: ColumnDef<CohortRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Cohort',
    cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.name}</span>,
  },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    id: 'fill',
    header: 'Fill',
    cell: ({ row }) => {
      const c = row.original;
      const pctFill = c.fill_rate !== null ? Math.round(c.fill_rate * 100) : null;
      return (
        <div className="w-40">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>
              {c.seats_taken}
              {c.capacity ? ` / ${c.capacity}` : ''}
            </span>
            {pctFill !== null ? <span className="tabular-nums">{pctFill}%</span> : null}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${pctFill ?? 0}%` }} />
          </div>
        </div>
      );
    },
  },
  { accessorKey: 'active', header: 'Active', cell: ({ row }) => <span className="tabular-nums">{row.original.active}</span> },
  { accessorKey: 'completed', header: 'Completed', cell: ({ row }) => <span className="tabular-nums">{row.original.completed}</span> },
];

export default function ReportsLearning() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-learning', params],
    queryFn: () => reportLearning(params ?? {}),
    enabled: params !== null,
  });
  const loading = isLoading || !data;

  const statusRows = data
    ? Object.entries(data.enrolments_by_status).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
      }))
    : [];


  // A failed request leaves `data` undefined, which would otherwise keep
  // `loading` true and render skeletons forever beneath an error banner.
  if (error && !data) {
    return (
      <>
        <PageHeader
          title="Learning"
          subtitle="Are enrolled students showing up and finishing?"
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
        title="Learning"
        subtitle="Are enrolled students showing up and finishing?"
        actions={
          <>
            <DateRangeControls onChange={onChange} />
            <ExportButton report="learning" params={params} />
          </>
        }
      />
      <Reveal className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiErrorMessage(error)}
          </div>
        ) : null}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)
          ) : (
            <>
              <MetricCard
                icon={GraduationCap}
                tone="green"
                value={<CountUp value={data.enrolments_by_status.active ?? 0} />}
                label="Active enrolments"
              />
              <MetricCard
                icon={Percent}
                tone="teal"
                value={pctFromFraction(data.completion.completion_rate)}
                label="Completion rate"
                helperText={`Median ${data.completion.median_days_to_complete} days to finish`}
              />
              <MetricCard
                icon={CalendarCheck}
                tone="blue"
                value={pctFromFraction(data.attendance.overall_rate)}
                label="Avg attendance"
                helperText={`${data.attendance.sessions_recorded.toLocaleString()} sessions`}
              />
              <MetricCard
                icon={Award}
                tone="purple"
                value={<CountUp value={data.certificates.total_issued} />}
                label="Certificates issued"
                helperText={data.certificates.revoked ? `${data.certificates.revoked} revoked` : undefined}
              />
            </>
          )}
        </div>

        {/* Enrolments + programme */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Enrolments by status</h2>
            {loading ? <Skeleton className="h-40 rounded-xl" /> : <BarList rows={statusRows} />}
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">By programme</h2>
            {loading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : (
              <BarList rows={data.by_programme.map((p) => ({ label: p.label, value: p.value }))} />
            )}
          </Card>
        </section>

        {/* Cohort health */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Cohort health</h2>
          <DataTable
            columns={cohortColumns}
            data={data?.cohort_health ?? []}
            loading={loading}
            empty={<Card className="px-6 py-10 text-center text-sm text-gray-500">No active cohorts.</Card>}
          />
        </section>

        {/* Attendance by cohort */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Attendance by cohort</h2>
          <Card className="p-6">
            {loading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : (
              <BarList
                color="#60a5fa"
                rows={data.attendance.by_cohort.map((c) => ({ label: c.label, value: c.value, note: `${c.value}%` }))}
                emptyText="No attendance recorded for this range."
              />
            )}
          </Card>
        </section>
      </Reveal>
    </>
  );
}
