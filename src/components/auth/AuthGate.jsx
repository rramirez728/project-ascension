import { useAuth } from '../../contexts/AuthContext.jsx';
import AuthPage from '../../pages/AuthPage.jsx';

/** Shows auth page when cloud is enabled but user is not signed in (guest mode allowed). */
export function AuthGate({ children }) {
  const { user, loading, guestMode, isCloudEnabled } = useAuth();

  if (!isCloudEnabled || guestMode) return children;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return children;
}
