import {
  BarChart3,
  ClipboardList,
  HelpCircle,
  GraduationCap,
  LineChart,
  Settings,
  Target,
  UserCircle,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

/** Roles allowed to use the console (mirrors AuthContext Role). */
export type NavRole = 'admin' | 'agent';

export interface NavItem {
  /** Plain-language label shown in the sidebar. */
  label: string;
  /** Router path (renamed for clarity; backend endpoint paths are unchanged). */
  path: string;
  icon: LucideIcon;
  /** One-line page explainer, rendered as the title-band subtitle. */
  explainer: string;
  /** Roles that may see this item. Defaults to admin-only. */
  roles?: NavRole[];
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Roles that may see this section. Defaults to admin-only. */
  roles?: NavRole[];
}

/*
 * Single source of truth for navigation: rendered in both the desktop sidebar and
 * the mobile drawer, and also used to look up each page's title + explainer for
 * its title band (see pageMetaFor).
 */
export const navSections: NavSection[] = [
  {
    id: 'reports',
    label: 'Reports',
    icon: LineChart,
    items: [
      {
        label: 'Overview',
        path: '/reports/overview',
        icon: BarChart3,
        explainer: 'Registration, onboarding, and learning at a glance for the chosen period.',
      },
      {
        label: 'Registration',
        path: '/reports/registration',
        icon: UserPlus,
        explainer: "Who's signing up, from where, and whether they verify.",
      },
      {
        label: 'Onboarding',
        path: '/reports/onboarding',
        icon: Target,
        explainer: 'Where people drop off between signup and enrolment, and how long each stage takes.',
      },
      {
        label: 'Learning',
        path: '/reports/learning',
        icon: GraduationCap,
        explainer: 'Are enrolled students showing up and finishing?',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: ClipboardList,
    roles: ['admin', 'agent'],
    items: [
      {
        label: 'Daily operations',
        path: '/operations',
        icon: ClipboardList,
        explainer: 'Sprint funnel, daily targets, pace, and team activity.',
        roles: ['admin', 'agent'],
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserCircle,
    items: [
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        explainer: 'Your account and console preferences.',
      },
      {
        label: 'Help & glossary',
        path: '/help',
        icon: HelpCircle,
        explainer: 'Plain-language definitions and a guided walkthrough.',
      },
    ],
  },
];

const allItems: NavItem[] = navSections.flatMap((section) => section.items);

/** Normalise a pathname for comparison (strip trailing slashes; root stays "/"). */
export function normalisePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Whether a nav item is active for the current route. Non-root items also match
 * their sub-routes (e.g. /reports/overview stays active on deeper paths), while "/"
 * only matches exactly.
 */
export function isItemActive(itemPath: string, pathname: string): boolean {
  const target = normalisePath(pathname);
  const ip = normalisePath(itemPath);
  if (ip === '/') return target === '/';
  return target === ip || target.startsWith(`${ip}/`);
}

/** Look up the nav item (title + explainer) for the current route. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return allItems.find((item) => isItemActive(item.path, pathname));
}

/** The section id that contains the given route (for auto-expand). */
export function sectionIdForPath(pathname: string): string | undefined {
  return navSections.find((section) =>
    section.items.some((item) => isItemActive(item.path, pathname)),
  )?.id;
}

/**
 * Sections (and their items) visible to a given role. Unspecified `roles` default
 * to admin-only; agent-visible sections (Operations) opt in via
 * `roles: ['admin','agent']`.
 */
export function visibleSections(role: NavRole | undefined): NavSection[] {
  if (!role) return [];
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (item.roles ?? ['admin']).includes(role)),
    }))
    .filter((section) => (section.roles ?? ['admin']).includes(role) && section.items.length > 0);
}
