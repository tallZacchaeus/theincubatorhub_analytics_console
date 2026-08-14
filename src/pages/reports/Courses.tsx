import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Info } from 'lucide-react';
import { reportCourses } from '@/api/endpoints/reports';
import Reveal from '@/components/motion/Reveal';
import DateRangeControls from '@/components/reports/DateRangeControls';
import ExportButton from '@/components/reports/ExportButton';
import PageHeader from '@/components/layout/PageHeader';
import ReportError from '@/components/reports/ReportError';
import { pctFromPercent } from '@/content/chart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseRow, ReportParams } from '@/types';

const nf = new Intl.NumberFormat();

const MAIN_APP_URL =
  (import.meta.env.VITE_MAIN_APP_URL as string | undefined) ?? 'https://app.theincubatorhub.org/super-admin';

/**
 * Deep link to the learners on a course.
 *
 * The main admin's student directory accepts `course_id` and applies it to the
 * CSV export as well, so this hands over both the list and the download in one
 * click. A count that you cannot act on is only half a report.
 */
function learnersUrl(courseId: number): string {
  const base = MAIN_APP_URL.replace(/\/$/, '');
  return `${base}/students?course_id=${courseId}`;
}

/** Coarse bands rather than a gradient, so the eye lands on the worst row. */
function toneFor(rate: number | null): string {
  if (rate === null) return 'bg-gray-50 text-gray-500';
  if (rate >= 60) return 'bg-green-50 text-green-800';
  if (rate >= 25) return 'bg-amber-50 text-amber-800';
  return 'bg-red-50 text-red-800';
}

function Rate({ value }: { value: number | null }) {
  // Null means nothing enrolled in range. A dash, not 0% — a course nobody
  // joined is a different problem from one 200 people joined and none finished,
  // and 0% would rank them together.
  if (value === null) {
    return <span className="text-gray-400" title="No enrolments in this period">—</span>;
  }

  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${toneFor(value)}`}>
      {pctFromPercent(value)}
    </span>
  );
}

function CourseTable({ courses }: { courses: CourseRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th scope="col" className="px-5 py-2 font-medium">Course</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Enrolled</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Started</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Completed</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Withdrew</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Certificates</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Start rate</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Completion</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Learners</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.course_id} className="border-b border-gray-100 last:border-0">
                <th scope="row" className="px-5 py-2.5 text-left font-medium text-gray-900">
                  {course.name}
                  {course.programme ? (
                    <span className="block text-xs font-normal text-gray-500">{course.programme}</span>
                  ) : null}
                </th>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{nf.format(course.enrolled)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                  {nf.format(course.active + course.completed)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{nf.format(course.completed)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">{nf.format(course.withdrawn)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{nf.format(course.certificates)}</td>
                <td className="px-3 py-2.5 text-right"><Rate value={course.start_rate} /></td>
                <td className="px-3 py-2.5 text-right"><Rate value={course.completion_rate} /></td>
                <td className="px-3 py-2.5 text-right">
                  <a
                    href={learnersUrl(course.course_id)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 transition hover:text-green-800"
                  >
                    View
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ReportsCourses() {
  const [params, setParams] = useState<ReportParams | null>(null);
  const onChange = useCallback((p: ReportParams) => setParams(p), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report-courses', params],
    queryFn: () => reportCourses(params ?? {}),
    enabled: params !== null,
  });

  const loading = isLoading || !data;

  const header = (
    <PageHeader
      title="Courses"
      subtitle="How each course is performing, and who is on it."
      actions={
        <>
          <DateRangeControls onChange={onChange} />
          <ExportButton report="courses" params={params} />
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
            <p className="font-semibold">Counts are enrolments that started in the selected period</p>
            <p className="mt-1">
              <strong>View</strong> opens that course's learners in the main admin, already filtered — where the
              CSV export is filtered to match.
            </p>
          </div>
        </Card>

        {loading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : data.courses.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">No courses yet</p>
            <p className="mt-1 text-sm text-gray-500">Courses appear here once the catalogue has entries.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Courses', value: data.totals.courses },
                { label: 'With enrolments', value: data.totals.with_enrolments },
                { label: 'Enrolments', value: data.totals.enrolled },
                { label: 'Completions', value: data.totals.completed },
              ].map((tile) => (
                <Card key={tile.label} className="p-5">
                  <div className="text-2xl font-bold tabular-nums text-gray-950">{nf.format(tile.value)}</div>
                  <div className="mt-1 text-xs text-gray-500">{tile.label}</div>
                </Card>
              ))}
            </div>

            <CourseTable courses={data.courses} />

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-700">How to read this</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                {data.notes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </Reveal>
    </>
  );
}
