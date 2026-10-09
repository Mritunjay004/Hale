# ADR 002: AI Provider Strategy and Resilient Fallbacks

- **Context:** Food parsing and lab report extraction need multimodal vision, PDF ingestion, fast speech-to-text, and zero-cost free-tier resilience.
- **Decision:** Google Gemini 1.5/2.0 Flash as primary provider (free tier: 15 RPM, native image & PDF understanding); Groq (Whisper-large-v3 for STT, Llama-3.3-70B for text) as primary STT and chat fallback; chained via an inverted `FallbackProvider` interface.
- **Rationale:** Gemini offers free multimodal + structured JSON schema enforcement; Groq offers sub-second Whisper transcription. The fallback decorator absorbs 429 rate limits seamlessly.
- **Consequences:** All AI calls validate against strict Zod schemas before returning; zero raw text output leaks into application state.

