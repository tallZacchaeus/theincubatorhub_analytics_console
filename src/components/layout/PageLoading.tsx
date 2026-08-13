import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while a lazily-loaded page chunk is in flight.
 *
 * Shaped like the report pages it stands in for — a title band, a row of tiles,
 * a panel — so the layout does not jump when the real page arrives. A centred
 * spinner would be less code but would collapse the page height and then push
 * everything down on load, which reads as a glitch on a slow connection.
 *
 * `aria-busy` with a live region tells screen readers something is loading;
 * without it the page announces nothing at all between navigation and render.
 */
export default function PageLoading() {
  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page…</span>

      <div className="space-y-2">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
