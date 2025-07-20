import { Composition } from "remotion";
import { Main } from "./MyComp/Main";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";
import { InstagramReel } from "./InstagramReel/InstagramReel";
import { VideoInstructions } from "./InstagramReel/VideoInstructions";
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
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
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
    </>
  );
};
