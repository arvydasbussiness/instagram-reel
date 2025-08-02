import { z } from "zod";
import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./Container";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { CompositionProps } from "../../types/constants";
import { useRendering } from "../helpers/use-rendering";

// Use the subtitle composition by default
const COMP_NAME = "InstagramReelWithSubtitles";

export const RenderControls: React.FC<{
  inputProps: z.infer<typeof CompositionProps>;
  setInputProps: React.Dispatch<React.SetStateAction<z.infer<typeof CompositionProps>>>;
}> = ({ inputProps, setInputProps }) => {
  const { renderMedia, state, undo } = useRendering(COMP_NAME, inputProps);

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "invoking" ||
      state.status === "error" ? (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Video Source</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={inputProps.videoSource}
                onChange={(e) => setInputProps({...inputProps, videoSource: e.target.value})}
                placeholder="test-video.mp4"
                disabled={state.status === "invoking"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Audio Source (optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={inputProps.audioSource}
                onChange={(e) => setInputProps({...inputProps, audioSource: e.target.value})}
                placeholder="test-audio.mp3"
                disabled={state.status === "invoking"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Audio Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="w-full"
                value={inputProps.audioVolume}
                onChange={(e) => setInputProps({...inputProps, audioVolume: parseFloat(e.target.value)})}
                disabled={state.status === "invoking"}
              />
              <span className="text-sm text-gray-500">{inputProps.audioVolume}</span>
            </div>
          </div>
          <Spacing></Spacing>
          <AlignEnd>
            <Button
              disabled={state.status === "invoking"}
              loading={state.status === "invoking"}
              onClick={renderMedia}
            >
              Render video
            </Button>
          </AlignEnd>
          {state.status === "error" ? (
            <ErrorComp message={state.error.message}></ErrorComp>
          ) : null}
        </>
      ) : null}
      {state.status === "rendering" || state.status === "done" ? (
        <>
          <ProgressBar
            progress={state.status === "rendering" ? state.progress : 1}
          />
          <Spacing></Spacing>
          <AlignEnd>
            <DownloadButton undo={undo} state={state}></DownloadButton>
          </AlignEnd>
        </>
      ) : null}
    </InputContainer>
  );
};
