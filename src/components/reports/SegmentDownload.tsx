import { useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { FUNNEL_STAGES, exportLearnerSegment } from '@/api/endpoints/reports';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import type { ReportParams } from '@/types';

interface Props {
  params: ReportParams | null;
}

/**
 * Downloads the learners behind the funnel, rather than the funnel's numbers.
 *
 * The report exports give counts; this gives the list of people you would
 * actually contact. The drop-off segments are offered first because they are
 * the ones that lead to action — "signed up, never started KYC" is a call list,
 * where "everyone who signed up" is just the cohort.
 *
 * Segment sizes match the funnel on screen: both are counted from the same
 * events over the same signup window.
 */
export default function SegmentDownload({ params }: Props) {
  const [busy, setBusy] = useState(false);

  async function download(reached: string, notReached: string | null) {
    setBusy(true);
    try {
      const { blob, filename } = await exportLearnerSegment(reached, notReached, params ?? {});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  // Consecutive pairs: reached stage N but not N+1 — the people who stalled
  // between them.
  const dropOffs = FUNNEL_STAGES.slice(0, -1).map((stage, i) => ({
    reached: stage.key,
    notReached: FUNNEL_STAGES[i + 1].key,
    label: `${stage.label} → never ${FUNNEL_STAGES[i + 1].label.toLowerCase()}`,
  }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={params === null || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
          Download learners
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Who dropped off</DropdownMenuLabel>
        {dropOffs.map((segment) => (
          <DropdownMenuItem
            key={`${segment.reached}-${segment.notReached}`}
            disabled={busy}
            onSelect={() => void download(segment.reached, segment.notReached)}
          >
            {segment.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Everyone who reached</DropdownMenuLabel>
        {FUNNEL_STAGES.map((stage) => (
          <DropdownMenuItem key={stage.key} disabled={busy} onSelect={() => void download(stage.key, null)}>
            {stage.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
