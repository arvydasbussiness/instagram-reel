import { Composition } from "remotion";
import { InstagramReel } from "./InstagramReel/InstagramReel";
import { VideoInstructions } from "./InstagramReel/VideoInstructions";
import {
  COMP_NAME,
  DURATION_IN_FRAMES,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  defaultMyCompProps,
} from "../../types/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={InstagramReel}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="VideoInstructions"
        component={VideoInstructions}
        durationInFrames={150}
        fps={30}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
