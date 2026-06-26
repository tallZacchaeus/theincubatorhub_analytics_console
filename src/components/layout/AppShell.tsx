import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import LogoMark from '@/components/LogoMark';
import TopBarHelp from '@/components/TopBarHelp';
import { GlossaryProvider } from '@/components/glossary/GlossaryProvider';
import FirstRunPrompt from '@/components/tour/FirstRunPrompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  isItemActive,
  sectionIdForPath,
  visibleSections,
  type NavRole,
  type NavSection,
} from '@/components/layout/navigation';
import { cn } from '@/lib/utils';

/** Two-letter initials from a name (falls back to email, then "?"). */
function initialsFor(name?: string | null, email?: string | null): string {
  const source = (name ?? email ?? '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/*
 * React reproduction of the main app's SuperAdminLayout: fixed white w-64 sidebar
 * with collapsible sections, gradient-avatar profile footer, a sticky blurred top
 * bar, and a mobile slide-over drawer. Wraps every protected route via <Outlet/>;
 * each page renders its own <PageHeader/> title band.
 */
export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sections visible to the signed-in user's role (admin sees all; agents will
  // see Operations once it lands).
  const sections = visibleSections(user?.role as NavRole | undefined);
  // All sections expanded by default (like the main app); the active section is
  // force-expanded on every route change.
  const [expanded, setExpanded] = useState<string[]>(() => sections.map((s) => s.id));

  useEffect(() => {
    const activeSection = sectionIdForPath(location.pathname);
    if (activeSection) {
      setExpanded((prev) => (prev.includes(activeSection) ? prev : [...prev, activeSection]));
    }
    // Close the mobile drawer whenever the route changes.
    setSidebarOpen(false);
  }, [location.pathname]);

  function toggleSection(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSignOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  function SidebarNav() {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Console navigation">
        <div className="space-y-1">
          {sections.map((section: NavSection) => {
            const sectionActive = section.items.some((item) =>
              isItemActive(item.path, location.pathname),
            );
            const isOpen = expanded.includes(section.id);
            const SectionIcon = section.icon;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    sectionActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50',
                  )}
                  aria-expanded={isOpen}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <SectionIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{section.label}</span>
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {/* Smooth expand/collapse via CSS grid rows (reduced-motion net makes it instant). */}
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                    isOpen ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="ml-6 space-y-1 overflow-hidden">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const itemActive = isItemActive(item.path, location.pathname);
                      return (
                        <button
                          key={item.path}
                          type="button"
                          tabIndex={isOpen ? 0 : -1}
                          aria-current={itemActive ? 'page' : undefined}
                          data-tour={item.path === '/analytics' ? 'nav-analytics' : undefined}
                          className={cn(
                            'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            itemActive
                              ? 'bg-green-50 font-semibold text-green-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
                          )}
                          onClick={() => navigate(item.path)}
                        >
                          {/* Animated active accent. */}
                          <span
                            className={cn(
                              'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-green-600 transition-all duration-200',
                              itemActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
                            )}
                            aria-hidden="true"
                          />
                          <ItemIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  function ProfileFooter() {
    return (
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {initialsFor(user?.name, user?.email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {user?.name ?? 'Admin'}
            </span>
            <span className="block truncate text-xs text-gray-500">{user?.email}</span>
          </span>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Sign out"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <GlossaryProvider>
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-gray-100 p-6">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg text-left transition hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Go to Home"
              onClick={() => navigate('/')}
            >
              <LogoMark className="h-10 w-10" />
              <span>
                <span className="block font-bold text-gray-950">Incubator Hub</span>
                <span className="block text-xs font-medium text-gray-500">Analytics</span>
              </span>
            </button>
          </div>
          <SidebarNav />
          <ProfileFooter />
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Go to Home"
            onClick={() => navigate('/')}
          >
            <LogoMark className="h-9 w-9" />
            <span>
              <span className="block text-sm font-bold text-gray-950">Incubator Hub</span>
              <span className="block text-xs text-gray-500">Analytics</span>
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <SidebarNav />
        <ProfileFooter />
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="hidden max-w-md flex-1 sm:block">
                <label className="sr-only" htmlFor="console-search">
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="console-search"
                    type="search"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    placeholder="Search reports..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 md:inline-flex"
                onClick={() => navigate('/campaigns')}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New campaign
              </button>
              <TopBarHelp />
              <button
                type="button"
                className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                aria-label="Open settings"
                onClick={() => navigate('/settings')}
              >
                {initialsFor(user?.name, user?.email)}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors />
      <FirstRunPrompt />
    </div>
    </TooltipProvider>
    </GlossaryProvider>
  );
}
