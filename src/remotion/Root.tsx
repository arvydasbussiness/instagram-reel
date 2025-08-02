import { Composition } from "remotion";
import { InstagramReel } from "./InstagramReel/InstagramReel";
import { InstagramReelWithTranscript } from "./InstagramReel/InstagramReelWithTranscript";
import { VideoInstructions } from "./InstagramReel/VideoInstructions";
import { exampleSubtitles } from "../data/exampleSubtitles";
import {
  INSTAGRAM_REEL_COMP_NAME,
  INSTAGRAM_REEL_WIDTH,
  INSTAGRAM_REEL_HEIGHT,
  INSTAGRAM_REEL_FPS,
  INSTAGRAM_REEL_DURATION,
  defaultInstagramReelProps,
} from "./InstagramReel/constants";

// Type assertion to satisfy Remotion's component type requirements
const InstagramReelComponent = InstagramReel as React.FC<Record<string, unknown>>;
const InstagramReelWithTranscriptComponent = InstagramReelWithTranscript as React.FC<Record<string, unknown>>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={INSTAGRAM_REEL_COMP_NAME}
        component={InstagramReelComponent}
        durationInFrames={INSTAGRAM_REEL_DURATION}
        fps={INSTAGRAM_REEL_FPS}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={defaultInstagramReelProps}
      />
      <Composition
        id="InstagramReelWithSubtitles"
        component={InstagramReelWithTranscriptComponent}
        durationInFrames={INSTAGRAM_REEL_DURATION}
        fps={INSTAGRAM_REEL_FPS}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={{
          ...defaultInstagramReelProps,
          autoTranscribe: true,
          transcriptApiUrl: 'http://13.48.58.235',
        }}
      />
      <Composition
        id="InstagramReelWithExampleSubtitles"
        component={InstagramReelComponent}
        durationInFrames={INSTAGRAM_REEL_DURATION}
        fps={INSTAGRAM_REEL_FPS}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={{
          ...defaultInstagramReelProps,
          subtitles: exampleSubtitles,
          enableSubtitles: true,
        }}
      />
      <Composition
        id="VideoInstructions"
        component={VideoInstructions}
        durationInFrames={150}
        fps={30}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
