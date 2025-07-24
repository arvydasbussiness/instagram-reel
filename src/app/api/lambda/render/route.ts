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

    // Generate subtitles if audio is provided but no subtitle file specified
    if (body.inputProps.audioSource && 
        body.inputProps.audioSource.trim() !== '' && 
        (!body.inputProps.subtitlesFile || body.inputProps.subtitlesFile.trim() === '')) {
      
      console.log(`Generating subtitles for ${body.inputProps.audioSource}...`);
      
      // Use Whisper Lambda to generate subtitles
      const bucketName = process.env.REMOTION_S3_BUCKET_NAME || SITE_NAME.split('/').pop() || 'your-remotion-bucket';
      const subtitleFile = await generateSubtitlesWithWhisperLambda(
        body.inputProps.audioSource,
        bucketName
      );
      
      if (subtitleFile) {
        body.inputProps.subtitlesFile = subtitleFile;
        console.log(`Subtitles generated: ${subtitleFile}`);
        
        // Try to load the subtitle data and pass it directly
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const subtitlePath = path.join(process.cwd(), 'public', 'subs', subtitleFile);
          const subtitleContent = await fs.readFile(subtitlePath, 'utf8');
          const subtitleData = JSON.parse(subtitleContent);
          
          // Pass subtitle data directly in props
          body.inputProps.subtitlesData = subtitleData;
          console.log(`Loaded ${subtitleData.length} subtitle segments into props`);
        } catch (err) {
          console.error('Could not load subtitle data:', err);
        }
      } else {
        // Fallback: assume subtitles might exist with expected name
        const audioNameWithoutExt = body.inputProps.audioSource.replace(/\.(mp3|wav|m4a|aac|ogg|flac)$/i, "");
        body.inputProps.subtitlesFile = `${audioNameWithoutExt}.json`;
        console.log(`Using expected subtitle file: ${body.inputProps.subtitlesFile}`);
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
