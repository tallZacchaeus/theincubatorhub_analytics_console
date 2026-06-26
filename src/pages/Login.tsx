import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/*
 * Themed sign-in. Mirrors the main app's auth layout (centered card on a soft
 * gradient, logo block, icon-prefixed fields) but uses the console's green
 * shadcn primitives so it reads as the admin console. Admin-only: a non-admin who
 * authenticates is immediately logged back out with a clear message.
 */
export default function Login() {
  const { ready, isAdmin, isStaff, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Agents only have Operations; admins go to their requested page (or Home).
  const destFor = (admin: boolean) => (admin ? redirect : '/operations');

  // Already an authenticated staff member — skip the form.
  if (ready && isStaff) {
    return <Navigate to={destFor(isAdmin)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      const admin = user.role === 'admin';
      if (user.role !== 'admin' && user.role !== 'agent') {
        await logout();
        setError('This console is for Incubator staff only.');
        return;
      }
      navigate(destFor(admin), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign in failed. Check your credentials.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white shadow-lg">
              IH
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">Analytics Console</h1>
            <p className="mt-2 text-sm text-gray-600">Sign in with your Incubator staff account.</p>
          </header>

          {error && (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="pl-10"
                  placeholder="admin@incubatorhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="px-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
