import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from '@/auth/RequireRole';
import AppShell from '@/components/layout/AppShell';
import PageLoading from '@/components/layout/PageLoading';
import Login from '@/pages/Login';

/*
 * Every page below is lazily imported.
 *
 * With static imports the whole console shipped as one 1.2 MB chunk, so the
 * login screen downloaded Recharts, GSAP, the data-grid and every report page
 * before it could render a password field — on a platform whose users are
 * explicitly mobile-first and low-bandwidth. Splitting at the route boundary
 * means a visitor pays for the page they asked for.
 *
 * Login is the deliberate exception and stays eagerly imported: it is the first
 * thing an unauthenticated visitor sees, and making it wait on a second network
 * round trip to render would trade a real delay for a theoretical saving.
 */
const Help = lazy(() => import('@/pages/Help'));
const Operations = lazy(() => import('@/pages/Operations'));
const Settings = lazy(() => import('@/pages/Settings'));
const ReportsOverview = lazy(() => import('@/pages/reports/Overview'));
const ReportsDaily = lazy(() => import('@/pages/reports/Daily'));
const ReportsRegistration = lazy(() => import('@/pages/reports/Registration'));
const ReportsOnboarding = lazy(() => import('@/pages/reports/Onboarding'));
const ReportsLearning = lazy(() => import('@/pages/reports/Learning'));
const ReportsCohorts = lazy(() => import('@/pages/reports/Cohorts'));
const ReportsCourses = lazy(() => import('@/pages/reports/Courses'));
const ComponentsShowcase = lazy(() => import('@/pages/dev/ComponentsShowcase'));

/*
 * Routing. /login is public; everything else lives behind RequireRole inside the
 * AppShell layout (sidebar + top bar + Outlet). Reports are admin-only; Operations
 * is staff-accessible (admin + agent). Each page renders its own title band.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/*
        * One boundary around the whole tree rather than one per route: the
        * fallback only ever replaces the page area, because AppShell renders
        * above it and stays mounted across navigations. The sidebar therefore
        * does not flicker while a chunk loads.
        */}
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Dev-only QA surface for the design-system kit; only mounted in dev builds. */}
          {import.meta.env.DEV && (
            <Route path="/dev/components" element={<ComponentsShowcase />} />
          )}
          <Route element={<RequireRole roles={['admin']} />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/reports/overview" replace />} />
              <Route path="/reports" element={<Navigate to="/reports/overview" replace />} />
              <Route path="/reports/overview" element={<ReportsOverview />} />
              <Route path="/reports/daily" element={<ReportsDaily />} />
              <Route path="/reports/registration" element={<ReportsRegistration />} />
              <Route path="/reports/cohorts" element={<ReportsCohorts />} />
              <Route path="/reports/courses" element={<ReportsCourses />} />
              <Route path="/reports/onboarding" element={<ReportsOnboarding />} />
              <Route path="/reports/learning" element={<ReportsLearning />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Route>
          </Route>
          {/* Operations is staff-accessible (admin + agent). */}
          <Route element={<RequireRole roles={['admin', 'agent']} />}>
            <Route element={<AppShell />}>
              <Route path="/operations" element={<Operations />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
