import { useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Card } from '../../ui/Card.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';

/** Email/password sign-in, sign-up, and password reset. */
export function AuthForm() {
  const { signIn, signUp, continueAsGuest, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Password reset email sent. Use the link in that email, then sign in.');
        setMode('signin');
      } else {
        await signUp(email, password);
        setMessage('Account created! Check your email to confirm, then sign in here. (If the email link fails, just sign in on this page after confirming.)');
        setMode('signin');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">
          {mode === 'signin' ? 'Sign in to your account' : mode === 'reset' ? 'Reset your password' : 'Create an account'}
        </h2>
        <p className="text-sm text-muted mt-1">
          {mode === 'reset'
            ? 'We will email you a link to choose a new password.'
            : mode === 'signin'
              ? 'Your fitness data syncs securely to the cloud.'
              : 'Save weight, food, workouts, and photos across devices.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={mode !== 'reset'}
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          className={mode === 'reset' ? 'hidden' : ''}
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : mode === 'signin' ? (
            <>
              <LogIn size={16} /> Sign In
            </>
          ) : mode === 'reset' ? (
            'Send reset link'
          ) : (
            <>
              <UserPlus size={16} /> Create Account
            </>
          )}
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-4">
        {mode === 'signin' && (
          <button
            type="button"
            onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
            className="text-accent hover:underline block mx-auto mb-3"
          >
            Forgot password?
          </button>
        )}
        {mode === 'reset' ? (
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
            className="text-accent hover:underline"
          >
            Back to sign in
          </button>
        ) : (
          <>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
              className="text-accent hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </>
        )}
      </p>

      <div className="mt-6 pt-4 border-t border-border text-center">
        <button
          type="button"
          onClick={continueAsGuest}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Continue without account — data stays on this device only
        </button>
      </div>
    </Card>
  );
}
