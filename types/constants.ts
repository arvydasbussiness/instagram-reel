import { z } from "zod";
export const COMP_NAME = "InstagramReel";

// Subtitle segment schema
export const SubtitleSegmentSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

export const CompositionProps = z.object({
  // Video settings
  videoSource: z.string(),
  isLocalFile: z.boolean(),
  
  // Audio settings (optional)
  audioSource: z.string(),
  isAudioLocal: z.boolean(),
  audioVolume: z.number(),
  audioStartFrom: z.number().optional(),
  audioEndAt: z.number().optional(),
  audioDelay: z.number(),
  
  // Subtitle settings
  subtitles: z.array(SubtitleSegmentSchema).optional(),
  enableSubtitles: z.boolean().optional(),
  autoTranscribe: z.boolean().optional(),
  transcriptApiUrl: z.string().optional(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  videoSource: "test-video.mp4",
  isLocalFile: true,
  audioSource: "test-audio.mp3", // Set to actual audio filename or leave empty string to use video's audio
  isAudioLocal: true,
  audioVolume: 0.8,
  audioStartFrom: undefined,
  audioEndAt: undefined,
  audioDelay: 0,
  subtitles: undefined,
  enableSubtitles: true,
  autoTranscribe: true,
  transcriptApiUrl: "http://13.48.58.235",
};

export const DURATION_IN_FRAMES = 900;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
