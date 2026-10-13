import type { SpeechToTextProvider } from "./interfaces.js";

export class GroqAudioProvider implements SpeechToTextProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "wav";
    const blob = new Blob([new Uint8Array(audioBuffer)], {
      type: mimeType || "audio/m4a",
    });

    const formData = new FormData();
    formData.append("file", blob, `recording.${ext}`);
    formData.append("model", "whisper-large-v3");
    formData.append(
      "prompt",
      "Transcribing food and meal log. Common words: roti, dal, sabzi, katori, idli, dosa, paneer, poha, chai, rice, chicken, salad."
    );
    formData.append("temperature", "0.1");
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Groq transcription failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { text?: string };
    return (data.text ?? "").trim();
  }
}


