import { AuthProvider } from './contexts/AuthContext.jsx';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthGate } from './components/auth/AuthGate.jsx';
import { AppRouter } from './routes/AppRouter.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

/** Bridges persisted settings theme into ThemeProvider once loaded. */
function AppWithTheme() {
  const { settings, loading } = useSettingsContext();

  if (loading || !settings) return <LoadingScreen />;

  return (
    <ThemeProvider initialTheme={settings.theme ?? 'dark'}>
      {settings.onboardingComplete ? <AppRouter /> : <OnboardingPage />}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <SettingsProvider>
          <AppWithTheme />
        </SettingsProvider>
      </AuthGate>
    </AuthProvider>
  );
}
