import { TrendingDown } from 'lucide-react';
import { POSITIVE } from '@/content/chart';

export interface FunnelStageInput {
  name: string;
  value: number;
}

const nf = new Intl.NumberFormat();

/*
 * Onboarding funnel with per-step conversion and drop-off.
 *
 * The percentages are computed with the same formulas the backend uses in
 * ReportsService::funnelWithConversion (pct of the first stage; step conversion
 * against the immediately preceding stage), so the Overview page and the
 * Onboarding report cannot drift apart.
 *
 * Colour is supplementary throughout: every bar carries its stage name, count
 * and percentage as text, and drop-off rows are labelled in words.
 */
export default function FunnelChart({ stages }: { stages: FunnelStageInput[] }) {
  if (stages.length === 0) {
    return <p className="text-sm text-gray-500">No funnel data for this range.</p>;
  }

  const first = stages[0]?.value ?? 0;

  return (
    <ol className="space-y-1">
      {stages.map((stage, i) => {
        const prev = i === 0 ? null : stages[i - 1].value;
        const pctOfFirst = first > 0 ? (stage.value / first) * 100 : 0;
        const stepConversion = prev && prev > 0 ? (stage.value / prev) * 100 : null;
        const dropoff = prev !== null ? Math.max(0, prev - stage.value) : null;

        return (
          <li key={stage.name}>
            {/* Drop-off sits between the previous stage and this one. */}
            {dropoff !== null && dropoff > 0 ? (
              <p className="flex items-center gap-1.5 py-1 pl-3 text-xs text-gray-500">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {nf.format(dropoff)} did not continue
                  {stepConversion !== null ? ` · ${stepConversion.toFixed(1)}% carried through` : ''}
                </span>
              </p>
            ) : null}

            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-gray-900">{stage.name}</span>
                <span className="text-xs tabular-nums text-gray-600">
                  <span className="font-semibold text-gray-900">{nf.format(stage.value)}</span>
                  {' · '}
                  {pctOfFirst.toFixed(1)}% of {stages[0].name.toLowerCase()}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(pctOfFirst, 0.5)}%`, backgroundColor: POSITIVE }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
