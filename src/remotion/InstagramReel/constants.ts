// Instagram Reel constants
export const INSTAGRAM_REEL_COMP_NAME = "InstagramReel";

// Instagram Reel dimensions (9:16 aspect ratio)
export const INSTAGRAM_REEL_WIDTH = 1080;
export const INSTAGRAM_REEL_HEIGHT = 1920;
export const INSTAGRAM_REEL_FPS = 30;
export const INSTAGRAM_REEL_DURATION = 900; // 30 seconds at 30fps

// Default props for Instagram Reel
export const defaultInstagramReelProps = {
  // Video settings
  videoSource: "test-video.mp4", // Put your video file in public/videos/test-video.mp4
  isLocalFile: true, // Set to true for local files, false for URLs
  
  // Audio settings (optional)
  audioSource: "test-audio.mp3", // Leave empty to disable audio, or add "test-audio.mp3" to enable
  isAudioLocal: true, // Set to true for local audio files, false for URLs
  audioVolume: 0.8, // Volume level (0 to 1)
  audioStartFrom: undefined, // Start audio from specific frame (optional)
  audioEndAt: undefined, // End audio at specific frame (optional)
  audioDelay: 0, // Delay audio start by frames (default: 0)
  
  // Subtitle settings
  subtitles: [], // Array of subtitle segments
  enableSubtitles: false, // Enable/disable subtitles
  
  // For remote URL usage:
  // videoSource: "https://example.com/your-video.mp4",
  // isLocalFile: false,
  // audioSource: "https://example.com/your-audio.mp3",
  // isAudioLocal: false,
};
