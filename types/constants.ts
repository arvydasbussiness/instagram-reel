import { z } from "zod";
export const COMP_NAME = "InstagramReel";

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
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  videoSource: "test-video.mp4",
  isLocalFile: true,
  audioSource: "", // Empty string to disable audio by default
  isAudioLocal: true,
  audioVolume: 0.8,
  audioStartFrom: undefined,
  audioEndAt: undefined,
  audioDelay: 0,
};

export const DURATION_IN_FRAMES = 900;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
