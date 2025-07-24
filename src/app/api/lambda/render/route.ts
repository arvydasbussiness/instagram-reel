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

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    
    // Debug environment variables
    console.log('Environment check in render route:', {
      REMOTION_AWS_ACCESS_KEY_ID: !!process.env.REMOTION_AWS_ACCESS_KEY_ID,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      REMOTION_AWS_SECRET_ACCESS_KEY: !!process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      REMOTION_AWS_REGION: process.env.REMOTION_AWS_REGION,
      AWS_REGION: process.env.AWS_REGION,
    });

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

    // Always generate fresh subtitles if audio is provided
    if (body.inputProps.audioSource && body.inputProps.audioSource.trim() !== '') {
      console.log(`Generating fresh subtitles for ${body.inputProps.audioSource}...`);
      
      // Only process local audio files
      if (body.inputProps.isAudioLocal) {
        try {
          // Generate subtitles using Whisper Lambda
          const subtitleFile = await generateSubtitlesWithWhisperLambda(
            body.inputProps.audioSource,
            bucketName
          );
          
          if (subtitleFile) {
            console.log(`Subtitles generated: ${subtitleFile}`);
            
            // Load the generated subtitle data
            const { createAWSClients } = await import("../../../../helpers/generate-subtitles-whisper-lambda");
            const { s3Client } = createAWSClients();
            const { GetObjectCommand } = await import("@aws-sdk/client-s3");
            
            try {
              const response = await s3Client.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: `subs/${subtitleFile}`
              }));
              
              const subtitleContent = await response.Body?.transformToString();
              if (subtitleContent) {
                const subtitleData = JSON.parse(subtitleContent);
                
                // Pass subtitle data directly in props
                body.inputProps.subtitleData = subtitleData;
                console.log(`Loaded ${subtitleData.length} subtitle segments to pass as data`);
              }
            } catch (error) {
              console.error('Failed to load generated subtitles:', error);
            }
          } else {
            console.log('Warning: Subtitle generation failed, video will render without subtitles');
          }
        } catch (error) {
          console.error('Error generating subtitles:', error);
        }
      } else {
        console.log('Skipping subtitle generation for remote audio URL');
      }
    }
    
    // Always pass the bucket name for S3 subtitle loading
    if (!body.inputProps.bucketName) {
      body.inputProps.bucketName = bucketName;
    }

    // Debug log the final inputProps
    console.log('Final inputProps being sent to Lambda:', JSON.stringify(body.inputProps, null, 2));

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
