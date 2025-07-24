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
import { generateSubtitlesWithWhisperLambda } from "../../../../helpers/generate-subtitles-whisper-lambda";

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
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
      );
    }

    const bucketName = process.env.REMOTION_S3_BUCKET_NAME || SITE_NAME.split('/').pop() || 'your-remotion-bucket';

    // Always generate subtitles if audio is provided
    if (body.inputProps.audioSource && body.inputProps.audioSource.trim() !== '') {
      console.log(`Generating subtitles for ${body.inputProps.audioSource}...`);
      
      // Use Whisper Lambda to generate subtitles
      const subtitleFile = await generateSubtitlesWithWhisperLambda(
        body.inputProps.audioSource,
        bucketName
      );
      
      if (subtitleFile) {
        // Set the subtitle file for the component to load from S3
        body.inputProps.subtitlesFile = subtitleFile;
        console.log(`Subtitles generated and will be loaded from S3: ${subtitleFile}`);
      } else {
        console.log('Warning: Subtitle generation failed, video will render without subtitles');
      }
    }
    
    // Always pass the bucket name for S3 subtitle loading
    if (!body.inputProps.bucketName) {
      body.inputProps.bucketName = bucketName;
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
      inputProps: body.inputProps,
      framesPerLambda: 30,
      downloadBehavior: {
        type: "download",
        fileName: "video.mp4",
      },
    });

    return result;
  },
);
