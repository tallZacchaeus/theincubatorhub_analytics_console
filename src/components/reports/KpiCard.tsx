import { ArrowDown, ArrowRight, ArrowUp, Info, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type KpiTone = 'green' | 'blue' | 'teal' | 'purple' | 'orange' | 'pink';

const TONES: Record<KpiTone, string> = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  pink: 'bg-pink-100 text-pink-700',
};

export interface KpiDelta {
  /** Value for the immediately preceding window of the same length. */
  previous: number;
  /** Percentage change, or null when the previous window was zero. */
  changePct: number | null;
}

const nf = new Intl.NumberFormat();

function signed(n: number): string {
  return `${n >= 0 ? '+' : '−'}${nf.format(Math.abs(n))}`;
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'green',
  definition,
  scope,
  delta,
  /** Label for what `delta.previous` covers, e.g. "previous 30 days". */
  comparisonLabel,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: KpiTone;
  /** Plain-language statement of exactly what is counted. */
  definition: string;
  /** Short qualifier under the value, e.g. "In selected range". */
  scope?: string;
  delta?: KpiDelta | null;
  comparisonLabel?: string;
  className?: string;
}) {
  const change = delta?.changePct ?? null;
  const absChange = delta ? value - delta.previous : null;

  // Direction is conveyed by an arrow glyph, a word in the accessible label and
  // the sign on the number — colour is the last cue, never the only one.
  const direction = absChange === null ? null : absChange > 0 ? 'up' : absChange < 0 ? 'down' : 'flat';
  const DirIcon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : ArrowRight;

  const directionWord = direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'unchanged';

  // Screen readers get the whole story in one sentence rather than having to
  // stitch together four separate text nodes.
  const srSummary = delta
    ? `${label}: ${nf.format(value)}. ${scope ?? ''} ${directionWord} ${
        change !== null ? `${Math.abs(change)} percent, ` : ''
      }${signed(absChange ?? 0)} compared with ${nf.format(delta.previous)} in the ${comparisonLabel ?? 'previous period'}.`
    : `${label}: ${nf.format(value)}. ${scope ?? ''} No comparison available for this metric.`;

  return (
    <article
      className={cn('flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm', className)}
    >
      <p className="sr-only">{srSummary}</p>

      <div aria-hidden="true" className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`What does ${label} count?`}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{definition}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div aria-hidden="true" className="mt-3">
        <p className="text-3xl font-bold tracking-tight tabular-nums text-gray-950">{nf.format(value)}</p>
        <h3 className="mt-1 text-sm font-semibold text-gray-700">{label}</h3>
        {scope ? <p className="mt-0.5 text-xs text-gray-500">{scope}</p> : null}
      </div>

      {/*
        A percentage on its own is unreadable — "+167%" of what? Every delta
        states the direction, the percentage, the absolute movement, the
        previous value and the window it covers.
      */}
      <div aria-hidden="true" className="mt-3 min-h-[2.5rem]">
        {delta ? (
          <>
            <p
              className={cn(
                'inline-flex items-center gap-1 text-sm font-semibold',
                direction === 'up' ? 'text-green-700' : direction === 'down' ? 'text-red-700' : 'text-gray-600',
              )}
            >
              <DirIcon className="h-3.5 w-3.5" />
              {change !== null ? `${Math.abs(change)}%` : '—'}
              <span className="font-medium text-gray-600">({signed(absChange ?? 0)})</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              vs {nf.format(delta.previous)} · {comparisonLabel ?? 'previous period'}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400">No comparison available</p>
        )}
      </div>
    </article>
  );
}
