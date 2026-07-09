import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ReportParams } from '@/types';

// Rolling-window presets (days). `all` and `custom` are handled separately below.
const PRESETS: { value: string; label: string; days: number }[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
];

// Lower bound for the "All time" window. Safely earlier than any platform data;
// the API clamps/handles a wide range fine (whereBetween on real rows only).
const ALL_TIME_START = '2020-01-01';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const GRANULARITIES: ReportParams['granularity'][] = ['day', 'week', 'month'];

/*
 * Per-report date range + (optional) granularity control. Emits ReportParams via
 * onChange whenever the selection changes (fires once on mount with the default
 * 30-day window). Presets: 7/30/90 days, All time, or a Custom from–to range.
 */
export default function DateRangeControls({
  onChange,
  showGranularity = false,
}: {
  onChange: (params: ReportParams) => void;
  showGranularity?: boolean;
}) {
  const [preset, setPreset] = useState('30d');
  const [granularity, setGranularity] = useState<ReportParams['granularity']>('day');
  // Custom range endpoints; default to a sensible last-30-days span until edited.
  const [customFrom, setCustomFrom] = useState(isoDaysAgo(30));
  const [customTo, setCustomTo] = useState(today());

  useEffect(() => {
    const g = showGranularity ? granularity : undefined;

    if (preset === 'custom') {
      // Only emit once both ends are set; guard against an inverted range.
      if (!customFrom || !customTo) return;
      const [from, to] = customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
      onChange({ from, to, granularity: g });
      return;
    }

    if (preset === 'all') {
      onChange({ from: ALL_TIME_START, to: today(), granularity: g });
      return;
    }

    const days = PRESETS.find((p) => p.value === preset)?.days ?? 30;
    onChange({ from: isoDaysAgo(days), to: today(), granularity: g });
    // onChange identity is stable from the parent (useCallback); deps are the selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, granularity, showGranularity, customFrom, customTo]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={setPreset}>
        <SelectTrigger className="w-44">
          <CalendarDays className="mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="custom">Custom range…</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' ? (
        <div className="flex items-center gap-1.5" role="group" aria-label="Custom date range">
          <Input
            type="date"
            aria-label="From date"
            value={customFrom}
            max={customTo || today()}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="w-40"
          />
          <span className="text-gray-400">–</span>
          <Input
            type="date"
            aria-label="To date"
            value={customTo}
            min={customFrom || undefined}
            max={today()}
            onChange={(e) => setCustomTo(e.target.value)}
            className="w-40"
          />
        </div>
      ) : null}

      {showGranularity ? (
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5" role="group" aria-label="Granularity">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                granularity === g ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
