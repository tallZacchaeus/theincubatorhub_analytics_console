import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { REPORT_SECTIONS, exportReport, type ReportName } from '@/api/endpoints/reports';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import type { ReportParams } from '@/types';

interface Props {
  report: ReportName;
  /**
   * Export exactly this section, skipping the menu. Used where a button sits
   * beside a single table rather than in the page header.
   */
  section?: string;
  label?: string;
  /**
   * The params the page passed to the report itself. Handed straight through so
   * the file matches what is on screen — deriving them separately here is how
   * an export ends up quietly disagreeing with the page it came from.
   */
  params: ReportParams | null;
}

/**
 * Downloads one table from the current report as CSV.
 *
 * Reports with a single table export on click; those with several offer a menu,
 * because each section is its own file. That split is deliberate — one CSV per
 * table keeps every download parseable by a spreadsheet or a script, which a
 * concatenated multi-table file is not.
 */
export default function ExportButton({ report, params, section, label = 'Export CSV' }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const sections: readonly { value: string; label: string }[] = section
    ? [{ value: section, label }]
    : REPORT_SECTIONS[report];

  async function download(section: string) {
    setBusy(section);
    try {
      const { blob, filename } = await exportReport(report, section, params ?? {});

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
      setBusy(null);
    }
  }

  // The range controls populate `params` on mount; until then an export would
  // silently fall back to the API's default window rather than the one shown.
  const disabled = params === null || busy !== null;

  if (sections.length === 1) {
    return (
      <Button variant="outline" disabled={disabled} onClick={() => void download(sections[0].value)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {sections.map((section) => (
          <DropdownMenuItem
            key={section.value}
            disabled={busy !== null}
            onSelect={() => void download(section.value)}
          >
            {section.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
