import { useAuth } from '../../contexts/AuthContext.jsx';
import AuthPage from '../../pages/AuthPage.jsx';

/** Shows auth page when cloud is enabled but user is not signed in. */
export function AuthGate({ children }) {
  const { user, loading, isCloudEnabled } = useAuth();

  if (!isCloudEnabled) return children;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return children;
}
