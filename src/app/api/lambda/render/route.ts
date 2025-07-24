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
import fs from "fs/promises";
import path from "path";

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

    // Handle subtitles - either use existing or generate new ones
    if (body.inputProps.subtitlesFile && body.inputProps.subtitlesFile.trim() !== '') {
      // Subtitles file is already specified, ensure it's uploaded to S3
      console.log(`Using existing subtitle file: ${body.inputProps.subtitlesFile}`);
      
      // Check if it needs to be uploaded from local to S3
      const { createAWSClients } = await import("../../../../helpers/generate-subtitles-whisper-lambda");
      const { s3Client } = createAWSClients();
      const { HeadObjectCommand, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const subtitleKey = `subs/${body.inputProps.subtitlesFile}`;
      
      try {
        // Check if already in S3
        await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: subtitleKey
        }));
        console.log(`Subtitle file already exists in S3: ${subtitleKey}`);
      } catch {
        // Not in S3, try to upload from local
        console.log(`Uploading local subtitle file to S3: ${subtitleKey}`);
        try {
          const localPath = path.join(process.cwd(), 'public', 'subs', body.inputProps.subtitlesFile);
          const content = await fs.readFile(localPath, 'utf-8');
          
          await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: subtitleKey,
            Body: content,
            ContentType: 'application/json'
          }));
          console.log(`Successfully uploaded subtitle file to S3`);
        } catch (uploadError) {
          console.error('Failed to upload subtitle file to S3:', uploadError);
        }
      }
    } else if (body.inputProps.audioSource && body.inputProps.audioSource.trim() !== '') {
      // No subtitle file specified, but audio exists - generate subtitles
      console.log(`Generating subtitles for ${body.inputProps.audioSource}...`);
      
      // Only process local audio files
      if (body.inputProps.isAudioLocal) {
        // Use Whisper Lambda to generate subtitles
        const subtitleFile = await generateSubtitlesWithWhisperLambda(
          body.inputProps.audioSource,
          bucketName
        );
        console.log("Subtitle generation result:", subtitleFile);
        if (subtitleFile) {
          // Set the subtitle file for the component to load from S3
          body.inputProps.subtitlesFile = subtitleFile;
          console.log(`Subtitles generated and will be loaded from S3: ${subtitleFile}`);
        } else {
          console.log('Warning: Subtitle generation failed, video will render without subtitles');
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
