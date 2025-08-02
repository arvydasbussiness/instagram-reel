import { AwsRegion, RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import {
  DISK,
  RAM,
  REGION,
  SITE_NAME,
  TIMEOUT,
} from "../../../../../config.mjs";
import { RenderRequest } from "../../../../../types/schema";
import { executeApi } from "../../../../helpers/api-response";
import { transcriptService, TranscriptService } from "../../../../services/transcriptService";

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {

    if (
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.REMOTION_AWS_ACCESS_KEY_ID
    ) {
      
      throw new TypeError(
        "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
      );
    }
    if (
      !process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
    ) {
      throw new TypeError(
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",      );
    }

    let inputProps = { ...body.inputProps };

    // If auto-transcribe is enabled and no subtitles are provided
    if (inputProps.autoTranscribe && !inputProps.subtitles && !inputProps.isLocalFile) {
      try {
        const service = inputProps.transcriptApiUrl 
          ? new TranscriptService(inputProps.transcriptApiUrl)
          : transcriptService;

        // Determine which source to transcribe
        const sourceToTranscribe = inputProps.audioSource || inputProps.videoSource;
        
        if (sourceToTranscribe) {
          console.log('Auto-transcribing from URL:', sourceToTranscribe);
          const subtitles = await service.transcribeFromUrl(sourceToTranscribe);
          
          // Add subtitles to input props
          inputProps = {
            ...inputProps,
            subtitles,
            enableSubtitles: true,
          };
          
          console.log(`Transcription successful: ${subtitles.length} subtitle segments`);
        }
      } catch (error) {
        console.error('Transcription failed:', error);
        // Continue without subtitles if transcription fails
      }
    }
    const result = await renderMediaOnLambda({
      codec: "h264",
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION as AwsRegion,
      serveUrl: SITE_NAME,
      composition: body.id,
      inputProps,
      framesPerLambda: 30,
      downloadBehavior: {
        type: "download",
        fileName: "video.mp4",
      },
    });

    return result;
  },
);