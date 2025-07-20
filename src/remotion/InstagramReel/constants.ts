// Instagram Reel constants
export const INSTAGRAM_REEL_COMP_NAME = "InstagramReel";

// Instagram Reel dimensions (9:16 aspect ratio)
export const INSTAGRAM_REEL_WIDTH = 1080;
export const INSTAGRAM_REEL_HEIGHT = 1920;
export const INSTAGRAM_REEL_FPS = 30;
export const INSTAGRAM_REEL_DURATION = 900; // 30 seconds at 30fps

// Default props for Instagram Reel
export const defaultInstagramReelProps = {
  // For local file: just use the filename (file should be in public/videos/)
  videoSource: "test-video.mp4", // Put your video file in public/videos/test-video.mp4
  isLocalFile: true, // Set to true for local files, false for URLs
  
  // For remote URL usage:
  // videoSource: "https://example.com/your-video.mp4",
  // isLocalFile: false,
}; 
