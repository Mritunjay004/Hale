import Groq, { toFile } from "groq-sdk";
import type { SpeechToTextProvider } from "./interfaces.js";

export class GroqAudioProvider implements SpeechToTextProvider {
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "wav";
    const file = await toFile(audioBuffer, `recording.${ext}`, {
      type: mimeType || "audio/m4a",
    });

    const response = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      prompt: "Transcribing food and meal log. Common words: roti, dal, sabzi, katori, idli, dosa, paneer, poha, chai, rice, chicken, salad.",
      temperature: 0.1,
      response_format: "json",
    });

    return response.text.trim();
  }
}

