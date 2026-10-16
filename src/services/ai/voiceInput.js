const SILENCE_MS = 1600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((voice) => voice.lang?.startsWith('en') && /natural|samantha|google/i.test(voice.name))
    || voices.find((voice) => voice.lang?.startsWith('en-US'))
    || voices.find((voice) => voice.lang?.startsWith('en'))
    || null;
}

/**
 * Click-to-talk conversation. Speaks a greeting, then keeps listening until
 * the person pauses. A short pause does not end the turn.
 */
export function createVoiceConversation({ greeting, onState, onTranscript, onUtterance, onError }) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  let active = false;
  let phase = 'idle';
  let recognition = null;
  let silenceTimer = null;
  let sessionText = '';
  let currentRecognitionText = '';

  const shownText = () => `${sessionText} ${currentRecognitionText}`.trim();

  const clearSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  };

  const stopRecognition = () => {
    clearSilence();
    if (!recognition) return;
    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    try { recognition.stop(); } catch { /* already stopped */ }
    recognition = null;
  };

  const speak = (text) => new Promise((resolve) => {
    if (!window.speechSynthesis || !text?.trim()) {
      resolve();
      return;
    }
    phase = 'speaking';
    onState?.('speaking');
    stopRecognition();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearInterval(kick);
      resolve();
    };
    const kick = setInterval(() => {
      if (!window.speechSynthesis.speaking) return;
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 8000);
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });

  const finishUtterance = async () => {
    const text = shownText();
    sessionText = '';
    currentRecognitionText = '';
    onTranscript?.('');
    if (!text || !active) {
      if (active) beginRecognition();
      return;
    }
    phase = 'thinking';
    onState?.('thinking');
    stopRecognition();
    let reply = '';
    try {
      reply = await onUtterance(text);
    } catch (error) {
      onError?.(error?.message || 'The assistant could not complete that.');
    }
    if (!active) return;
    if (reply) await speak(reply);
    if (!active) return;
    await delay(350);
    if (active) beginRecognition();
  };

  const armSilence = () => {
    clearSilence();
    silenceTimer = setTimeout(() => {
      if (phase === 'listening') finishUtterance();
    }, SILENCE_MS);
  };

  const beginRecognition = () => {
    if (!active) return;
    if (!Speech) {
      active = false;
      phase = 'idle';
      onState?.('idle');
      onError?.('This browser cannot use voice. Type what you ate instead.');
      return;
    }
    phase = 'listening';
    onState?.('listening');
    const next = new Speech();
    recognition = next;
    next.lang = 'en-US';
    next.continuous = true;
    next.interimResults = true;
    next.onresult = (event) => {
      if (phase !== 'listening') return;
      let chunk = '';
      for (const result of event.results) {
        chunk += `${result[0]?.transcript || ''} `;
      }
      currentRecognitionText = chunk.trim();
      onTranscript?.(shownText());
      if (shownText()) armSilence();
    };
    next.onerror = (event) => {
      if (!active) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        active = false;
        phase = 'idle';
        onState?.('idle');
        onError?.('Allow the microphone to talk with the assistant.');
      }
    };
    next.onend = () => {
      if (recognition !== next || phase !== 'listening') return;
      if (currentRecognitionText) {
        sessionText = shownText();
        currentRecognitionText = '';
      }
      setTimeout(() => {
        if (active && phase === 'listening' && recognition === next) beginRecognition();
      }, 250);
    };
    try {
      next.start();
    } catch {
      /* start() throws if a previous session has not released the mic yet */
    }
  };

  return {
    async start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.('This browser cannot use the microphone. Type what you ate instead.');
        onState?.('idle');
        return false;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        onError?.('Allow the microphone to talk with the assistant.');
        onState?.('idle');
        return false;
      }
      if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
        await Promise.race([
          new Promise((resolve) => { window.speechSynthesis.onvoiceschanged = resolve; }),
          delay(400),
        ]);
      }
      active = true;
      await speak(greeting);
      if (!active) return false;
      beginRecognition();
      return true;
    },
    stop() {
      active = false;
      phase = 'idle';
      sessionText = '';
      currentRecognitionText = '';
      stopRecognition();
      window.speechSynthesis?.cancel();
      onTranscript?.('');
      onState?.('idle');
    },
  };
}
