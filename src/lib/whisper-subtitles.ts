// Type definitions for whisper subtitles
export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface WhisperSubtitleData {
  segments: SubtitleSegment[];
}
