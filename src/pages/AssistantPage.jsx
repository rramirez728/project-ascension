import { useEffect, useRef, useState } from 'react';
import { Mic, ImagePlus, Send } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sendAssistantMessage } from '../services/ai/assistantClient.js';
import { createRealtimeVoice } from '../services/ai/realtimeVoice.js';
import { notifyDataChanged } from '../utils/dataEvents.js';

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export default function AssistantPage() {
  const { user, isCloudEnabled, showSignIn } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const talkRef = useRef(null);
  const fileRef = useRef(null);
  const conversationRef = useRef(null);

  useEffect(() => {
    conversationRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => () => talkRef.current?.stop(), []);

  const push = (role, content) => setMessages((current) => [...current, { role, content }]);

  const handleResult = (result, userText) => {
    if (userText) push('user', userText);
    if (result?.transcript && result.transcript !== userText) push('user', result.transcript);
    if (result?.error) {
      setError(result.message || 'The assistant could not complete that.');
      return;
    }
    if (result?.message) push('assistant', result.message);
    if (result?.conversationId) setConversationId(result.conversationId);
    if (result?.pending?.length) setPending((current) => [...current, ...result.pending]);
    if (result?.saved) notifyDataChanged();
  };

  const send = async (payload, userText) => {
    setBusy(true);
    setError('');
    try {
      const result = await sendAssistantMessage({ conversationId, ...payload });
      handleResult(result, userText);
    } catch (err) {
      setError(err.message || 'The assistant could not complete that.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (action) => {
    setBusy(true);
    setError('');
    try {
      const result = await sendAssistantMessage({ confirmActionId: action.id, conversationId });
      if (result?.saved) {
        setPending((current) => current.filter((item) => item.id !== action.id));
        push('assistant', 'Saved.');
        notifyDataChanged();
      } else {
        setError(result?.message || 'That entry was not saved.');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleVoice = async () => {
    if (talkRef.current) {
      talkRef.current.stop();
      talkRef.current = null;
      setVoiceState('idle');
      setLiveTranscript('');
      return;
    }
    if (!user) {
      setError('Sign in to talk with the assistant.');
      return;
    }
    setError('');
    const session = createRealtimeVoice({
      request: async (payload) => {
        const result = await sendAssistantMessage({
          conversationId: conversationRef.current,
          ...payload,
        });
        if (result?.conversationId) {
          conversationRef.current = result.conversationId;
          setConversationId(result.conversationId);
        }
        return result;
      },
      onState: setVoiceState,
      onUserText: (text) => {
        setLiveTranscript(text);
        push('user', text);
      },
      onAssistantText: (text) => {
        setLiveTranscript('');
        push('assistant', text);
      },
      onPending: (action) => setPending((current) => (
        current.some((item) => item.id === action.id) ? current : [...current, action]
      )),
      onSaved: () => {
        setPending([]);
        notifyDataChanged();
      },
      onError: (message) => setError(message),
    });
    talkRef.current = session;
    const started = await session.start();
    if (!started) {
      talkRef.current = null;
      setVoiceState('idle');
    }
  };

  const voiceLabel = voiceState === 'connecting'
    ? 'Connecting.'
    : voiceState === 'listening'
      ? 'Listening. You can interrupt.'
      : voiceState === 'speaking'
        ? 'Speaking.'
        : voiceState === 'thinking'
          ? 'One moment.'
          : '';

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="AI Assistant" subtitle="Nutrition, weight, and training in one conversation" />
      {!user && isCloudEnabled && (
        <Card className="mb-4">
          <p className="text-sm">Sign in to use the assistant. Food and workout logging on this device still work without it.</p>
          <Button className="mt-4" onClick={showSignIn}>Sign in</Button>
        </Card>
      )}
      <Card className="min-h-[50vh] flex flex-col">
        <div className="flex-1 space-y-3 mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted">
              Click Talk. The assistant greets you in its own voice, then you can tell it what you ate or trained. Nothing is saved until you say yes or tap Confirm.
            </p>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-accent/10 ml-8' : 'bg-border/20 mr-8'}`}>
              {message.content}
            </div>
          ))}
          {pending.map((action) => (
            <div key={action.id} className="rounded-2xl border border-nutrition/40 px-4 py-3 text-sm">
              <p className="font-medium">Not saved yet</p>
              <p className="text-muted mt-1">{action.summary}</p>
              <Button className="mt-3" size="sm" disabled={busy} onClick={() => confirm(action)}>Confirm and save</Button>
            </div>
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        {(voiceLabel || liveTranscript) && (
          <div className="mb-3 text-sm">
            {voiceLabel && <p className="text-nutrition">{voiceLabel}</p>}
            {liveTranscript && <p className="mt-1">{liveTranscript}</p>}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const imageDataUrl = await readFile(file);
            send({ message: draft, imageDataUrl }, draft || 'Photo');
            setDraft('');
          }} />
          <Button variant="secondary" aria-label="Add photo" onClick={() => fileRef.current?.click()}><ImagePlus size={16} /></Button>
          <Button
            variant={voiceState === 'idle' ? 'secondary' : 'primary'}
            className={voiceState === 'listening' ? 'animate-pulse' : ''}
            aria-label={voiceState === 'idle' ? 'Start voice conversation' : 'End voice conversation'}
            onClick={toggleVoice}
          >
            <Mic size={16} />
            {voiceState === 'idle' ? 'Talk' : 'End'}
          </Button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Log food, weight, or a workout"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm"
          />
          <Button aria-label="Send" disabled={busy || !draft.trim()} onClick={() => {
            const text = draft.trim();
            setDraft('');
            send({ message: text }, text);
          }}
          >
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
