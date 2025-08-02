import { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import { z } from "zod";
import { CompositionProps } from "../../types/constants";
import { SubtitleSegment } from "../../remotion/InstagramReel/components/Subtitles";

interface RenderOptions {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
}

interface RenderWithSubtitlesOptions extends RenderOptions {
  // Override subtitle options
  autoTranscribe?: boolean;
  subtitles?: SubtitleSegment[];
  transcriptApiUrl?: string;
}

export class RenderAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Render a video with optional automatic transcription
   */
  async renderWithSubtitles(options: RenderWithSubtitlesOptions): Promise<RenderMediaOnLambdaOutput> {
    const response = await fetch(`${this.baseUrl}/api/lambda/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',      },
      body: JSON.stringify({
        id: options.id,
        inputProps: {
          ...options.inputProps,
          autoTranscribe: options.autoTranscribe ?? options.inputProps.autoTranscribe,
          subtitles: options.subtitles ?? options.inputProps.subtitles,
          transcriptApiUrl: options.transcriptApiUrl ?? options.inputProps.transcriptApiUrl,
          enableSubtitles: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Render failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Check render progress
   */
  async checkProgress(bucketName: string, renderId: string) {
    const response = await fetch(`${this.baseUrl}/api/lambda/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketName,
        id: renderId,
      }),
    });
    if (!response.ok) {
      throw new Error(`Progress check failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Pre-transcribe a video/audio URL before rendering
   * Useful for preview or manual subtitle editing
   */
  async preTranscribe(url: string, apiUrl?: string): Promise<SubtitleSegment[]> {
    const service = apiUrl 
      ? new (await import('../../services/transcriptService')).TranscriptService(apiUrl)
      : (await import('../../services/transcriptService')).transcriptService;
    
    return service.transcribeFromUrl(url);
  }
}

export const renderApi = new RenderAPI();