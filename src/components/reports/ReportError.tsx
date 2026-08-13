import { AlertTriangle, RefreshCw } from 'lucide-react';
import { apiErrorMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  error: unknown;
  onRetry?: () => void;
}

/**
 * The single failure state for a report body.
 *
 * Report pages derive `loading` as `isLoading || !data`, so a failed request
 * left `loading` true forever and the page rendered skeletons — or worse, a
 * zeroed empty state — underneath the error banner. On the YAYA report that
 * read as a genuine "0 referrals" for a link that had actually driven over a
 * thousand conversions.
 *
 * Rendering this INSTEAD of the report body (rather than above it) makes a
 * failure unambiguous, and the retry button means a transient error doesn't
 * cost a full page reload.
 */
export default function ReportError({ error, onRetry }: Props) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center" role="alert">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-950">This report couldn’t be loaded</p>
        <p className="mt-1 text-sm text-gray-600">{apiErrorMessage(error)}</p>
        <p className="mt-2 text-xs text-gray-500">
          No figures are shown because none could be read — this is not a zero.
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
