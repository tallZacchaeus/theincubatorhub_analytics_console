import { BarChart3, Check, ChevronDown, LayoutDashboard, Megaphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AppId = 'analytics' | 'marketing' | 'admin';

/*
 * Cross-app switcher. The three admin surfaces share one backend + session, so we
 * just link out (same-tab) between subdomains. URLs are env-overridable; defaults
 * target the production hostnames.
 */
const APPS: { id: AppId; label: string; icon: typeof BarChart3; url: string }[] = [
  {
    id: 'analytics',
    label: 'Analytics Console',
    icon: BarChart3,
    url: (import.meta.env.VITE_ANALYTICS_CONSOLE_URL as string | undefined) ?? 'https://analytics.theincubatorhub.org',
  },
  {
    id: 'marketing',
    label: 'Marketing Console',
    icon: Megaphone,
    url: (import.meta.env.VITE_MARKETING_CONSOLE_URL as string | undefined) ?? 'https://marketing.theincubatorhub.org',
  },
  {
    id: 'admin',
    label: 'Main Admin',
    icon: LayoutDashboard,
    url: (import.meta.env.VITE_MAIN_APP_URL as string | undefined) ?? 'https://app.theincubatorhub.org/super-admin',
  },
];

export default function AppSwitcher({ current }: { current: AppId }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        aria-label="Switch app"
      >
        <span className="hidden sm:inline">Apps</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch app</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {APPS.map((app) => {
          const isCurrent = app.id === current;
          const Icon = app.icon;
          return (
            <DropdownMenuItem
              key={app.id}
              disabled={isCurrent}
              onSelect={() => {
                if (!isCurrent) window.location.assign(app.url);
              }}
              className="gap-2"
            >
              <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              <span className="flex-1">{app.label}</span>
              {isCurrent && <Check className="h-4 w-4 text-green-600" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
