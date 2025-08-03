import { SubtitleSegment } from '../remotion/InstagramReel/components/Subtitles';

export interface TranscriptResponse {
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  // Add other fields based on your API response
}

export class TranscriptService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://13.48.58.235') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload audio/video file and get transcript with timestamps
   */
  async transcribeFile(file: File): Promise<SubtitleSegment[]> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data: TranscriptResponse = await response.json();

      // Convert API response to subtitle segments
      if (data.segments) {
        return data.segments.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
        }));
      }

      // If no segments, create a single segment
      return [{
        text: data.text,
        start: 0,
        end: 10, // Default duration
      }];
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Transcribe from URL
   */  async transcribeFromUrl(url: string): Promise<SubtitleSegment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data: TranscriptResponse = await response.json();

      // Convert API response to subtitle segments
      if (data.segments) {
        return data.segments.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
        }));
      }

      // If no segments, create a single segment
      return [{
        text: data.text,
        start: 0,
        end: 10, // Default duration
      }];
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}

export const transcriptService = new TranscriptService();