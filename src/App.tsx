import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from '@/auth/RequireRole';
import AppShell from '@/components/layout/AppShell';
import Help from '@/pages/Help';
import Login from '@/pages/Login';
import Operations from '@/pages/Operations';
import Settings from '@/pages/Settings';
import ReportsOverview from '@/pages/reports/Overview';
import ReportsDaily from '@/pages/reports/Daily';
import ReportsRegistration from '@/pages/reports/Registration';
import ReportsOnboarding from '@/pages/reports/Onboarding';
import ReportsLearning from '@/pages/reports/Learning';
import ComponentsShowcase from '@/pages/dev/ComponentsShowcase';

/*
 * Routing. /login is public; everything else lives behind RequireRole inside the
 * AppShell layout (sidebar + top bar + Outlet). Reports are admin-only; Operations
 * is staff-accessible (admin + agent). Each page renders its own title band.
 */
export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
