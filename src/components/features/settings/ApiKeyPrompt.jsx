import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button.jsx';
import { useSettingsContext } from '../../../contexts/SettingsContext.jsx';

export const API_KEY_PROMPT_KEY = 'ascension-api-key-prompt';

/** One-time notice after onboarding, pointing a new account to their own OpenAI key. */
export function ApiKeyPrompt() {
  const navigate = useNavigate();
  const { settings } = useSettingsContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(API_KEY_PROMPT_KEY) !== '1') return;
    if (settings?.openaiApiKey) {
      sessionStorage.removeItem(API_KEY_PROMPT_KEY);
      return;
    }
    setOpen(true);
  }, [settings?.openaiApiKey]);

  if (!open) return null;

  const dismiss = () => {
    sessionStorage.removeItem(API_KEY_PROMPT_KEY);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-prompt-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="api-key-prompt-title" className="text-lg font-semibold">Add your OpenAI key</h2>
        <p className="text-sm text-muted mt-2">
          The assistant uses your own OpenAI credits. Open Settings and paste your API key there. A ChatGPT subscription does not cover this.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              dismiss();
              navigate('/settings#openai-key');
            }}
          >
            Go to Settings
          </Button>
          <Button variant="secondary" onClick={dismiss}>Not now</Button>
        </div>
      </div>
    </div>
  );
}
