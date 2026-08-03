import { AuthForm } from '../components/features/auth/AuthForm.jsx';

/** Full-screen auth page shown when Supabase is configured and user is not signed in. */
export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Project Ascension</h1>
        <p className="text-muted mt-1">Personal fitness dashboard</p>
      </div>
      <AuthForm />
    </div>
  );
}
