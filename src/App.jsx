import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AppRouter } from './routes/AppRouter.jsx';

/** Bridges persisted settings theme into ThemeProvider once loaded. */
function AppWithTheme() {
  const { settings, loading } = useSettingsContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider initialTheme={settings?.theme ?? 'dark'}>
      <AppRouter />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppWithTheme />
    </SettingsProvider>
  );
}
