import { Composition } from "remotion";
import { InstagramReel } from "./InstagramReel/InstagramReel";
import { VideoInstructions } from "./InstagramReel/VideoInstructions";
import { InstagramReelAuto } from "./InstagramReelAuto";
import SubtitleTest from "./SubtitleTest";
import {
  INSTAGRAM_REEL_COMP_NAME,
  INSTAGRAM_REEL_WIDTH,
  INSTAGRAM_REEL_HEIGHT,
  INSTAGRAM_REEL_FPS,
  INSTAGRAM_REEL_DURATION,
  defaultInstagramReelProps,
} from "./InstagramReel/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={INSTAGRAM_REEL_COMP_NAME}
        component={InstagramReel}
        durationInFrames={INSTAGRAM_REEL_DURATION}
        fps={INSTAGRAM_REEL_FPS}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={defaultInstagramReelProps}
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
      <Composition
        id="InstagramReelAuto"
        component={InstagramReelAuto}
        durationInFrames={360}
        fps={30}
        width={INSTAGRAM_REEL_WIDTH}
        height={INSTAGRAM_REEL_HEIGHT}
        defaultProps={{}}
      />
      <Composition
        id="SubtitleTest"
        component={SubtitleTest}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
