function waitForIce(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    pc.addEventListener('icegatheringstatechange', onChange);
    setTimeout(finish, 2000);
  });
}

/**
 * Full OpenAI voice. The browser carries the audio. The server keeps the API key
 * and runs the logging tools.
 */
export function createRealtimeVoice({ request, onState, onUserText, onAssistantText, onPending, onSaved, onError }) {
  let peer = null;
  let microphone = null;
  let channel = null;
  let audio = null;
  let stopped = false;
  let latestUserText = '';
  const handledCalls = new Set();

  const send = (event) => {
    if (channel?.readyState === 'open') channel.send(JSON.stringify(event));
  };

  const handleEvent = async (event) => {
    if (stopped) return;
    if (event.type === 'input_audio_buffer.speech_started') onState?.('listening');
    if (event.type === 'response.created') onState?.('speaking');
    if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) {
      latestUserText = event.transcript;
      onUserText?.(event.transcript);
    }
    const assistantTranscript = event.transcript
      && (event.type === 'response.output_audio_transcript.done' || event.type === 'response.audio_transcript.done');
    if (assistantTranscript) onAssistantText?.(event.transcript);

    if (event.type === 'error') {
      onError?.(event.error?.message || 'The voice connection hit a problem.');
    }

    if (event.type !== 'response.done') return;
    const calls = (event.response?.output || []).filter((item) => item.type === 'function_call' && item.call_id);
    if (!calls.length) {
      onState?.('listening');
      return;
    }
    onState?.('thinking');
    for (const call of calls) {
      if (handledCalls.has(call.call_id)) continue;
      handledCalls.add(call.call_id);
      let result;
      try {
        result = await request({
          toolCall: { name: call.name, arguments: call.arguments },
          userText: latestUserText,
        });
      } catch (error) {
        result = { ok: false, saved: false, message: error?.message || 'The log could not be saved.' };
      }
      const pending = result?.pending || (result?.pendingAction ? [result.pendingAction] : []);
      pending.forEach((action) => onPending?.(action));
      if (result?.saved) onSaved?.();
      send({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result || { ok: false, saved: false }),
        },
      });
    }
    if (!stopped) send({ type: 'response.create' });
  };

  return {
    async start() {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
        onError?.('This browser cannot use the voice conversation. Type what you ate instead.');
        onState?.('idle');
        return false;
      }
      onState?.('connecting');
      try {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        onError?.('Allow the microphone to talk with the assistant.');
        onState?.('idle');
        return false;
      }
      if (stopped) return false;

      peer = new RTCPeerConnection();
      audio = new Audio();
      audio.autoplay = true;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        audio.play().catch(() => {});
      };
      microphone.getTracks().forEach((track) => peer.addTrack(track, microphone));
      channel = peer.createDataChannel('oai-events');
      channel.addEventListener('message', (event) => {
        try {
          handleEvent(JSON.parse(event.data));
        } catch {
          /* ignore a malformed event */
        }
      });
      channel.addEventListener('open', () => {
        if (stopped) return;
        onState?.('listening');
        send({
          type: 'response.create',
          response: {
            instructions: 'Greet the user in one short sentence and ask what they ate or trained today.',
          },
        });
      });

      const offer = await peer.createOffer();
      const ice = waitForIce(peer);
      await peer.setLocalDescription(offer);
      await ice;
      if (stopped) return false;

      const result = await request({ realtimeSdp: peer.localDescription.sdp });
      if (stopped) return false;
      if (!result?.sdp || !String(result.sdp).startsWith('v=')) {
        onError?.(result?.message || 'The voice connection could not start.');
        this.stop();
        return false;
      }
      await peer.setRemoteDescription({ type: 'answer', sdp: result.sdp });
      return true;
    },
    stop() {
      stopped = true;
      microphone?.getTracks().forEach((track) => track.stop());
      try { channel?.close(); } catch { /* already closed */ }
      try { peer?.close(); } catch { /* already closed */ }
      if (audio) audio.srcObject = null;
      peer = null;
      microphone = null;
      channel = null;
      audio = null;
      onState?.('idle');
    },
  };
}
