// Stub file for subtitles
// This can be populated with actual subtitle data or left empty

interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export const subtitles: Record<string, SubtitleSegment[]> = {};
