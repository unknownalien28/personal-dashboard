/**
 * Architecture for future voice interaction. Defining the adapter shape now
 * (mirroring the AIProvider pattern in `providers/types.ts`) means adding
 * real speech-to-text/text-to-speech later is a new adapter file, not a
 * refactor of ChatInput or chat-service.
 *
 * Intended integration points once implemented:
 *   - ChatInput gets a mic button that calls `VoiceAdapter.startListening`
 *     and appends interim/final transcripts into the same textarea state
 *     it already manages - no new input path required.
 *   - chat-service's `sendUserMessage` is reused unchanged; voice only ever
 *     produces text that flows through the exact same pipeline as typing.
 *   - An optional `speak()` call could read a completed assistant message
 *     aloud, gated by its own Visual Effects-style setting.
 *
 * Nothing in this file runs yet - it exists purely so the rest of the
 * system (ChatInput, chat-service) never needs to change shape when voice
 * is actually implemented.
 */
export interface VoiceTranscriptEvent {
  text: string;
  isFinal: boolean;
}

export interface VoiceAdapter {
  isSupported: () => boolean;
  startListening: (onTranscript: (event: VoiceTranscriptEvent) => void) => void;
  stopListening: () => void;
  speak?: (text: string) => void;
}
