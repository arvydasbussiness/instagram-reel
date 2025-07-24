import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { SubtitleSegment } from "../lib/whisper-subtitles";
import fs from "fs/promises";
import path from "path";

// Create AWS clients inside functions to ensure env vars are loaded
export function createAWSClients() {
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || "eu-north-1";

  // Debug logging
  console.log('Creating AWS clients with:', {
    hasAccessKeyId: !!accessKeyId,
    hasSecretKey: !!secretAccessKey,
    region: awsRegion,
  });

  // Only pass credentials if they exist
  const clientConfig: any = {
    region: awsRegion
  };

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey
    };
  }

  return {
    lambdaClient: new LambdaClient(clientConfig),
    s3Client: new S3Client(clientConfig)
  };
}

/**
 * Parse WebVTT format to subtitle segments
 */
function parseVTT(vttContent: string): SubtitleSegment[] {
  const lines = vttContent.split('\n');
  const segments: SubtitleSegment[] = [];
  
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim() || lines[i].startsWith('WEBVTT')) {
      i++;
      continue;
    }
    
    if (lines[i].includes('-->')) {
      const [startTime, endTime] = lines[i].split('-->').map(t => t.trim());
      const start = parseTimestamp(startTime);
      const end = parseTimestamp(endTime);
      
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        text += (text ? ' ' : '') + lines[i].trim();
        i++;
      }
      
      if (text) {
        segments.push({ start, end, text });
      }
    }
    i++;
  }
  
  return segments;
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return parseFloat(timestamp);
}

/**
 * Generate subtitles using the Whisper Lambda function
 */
export async function generateSubtitlesWithWhisperLambda(
  audioFileName: string,
  bucketName: string
): Promise<string | null> {
  if (!audioFileName || audioFileName.trim() === '') {
    return null;
  }

  // Create AWS clients
  const { lambdaClient, s3Client } = createAWSClients();

  const audioNameWithoutExt = audioFileName.replace(/\.(mp3|wav|m4a|aac|ogg|flac)$/i, "");
  const subtitleKey = `subs/${audioNameWithoutExt}.json`;
  const localSubtitlePath = path.join(process.cwd(), 'public', 'subs', `${audioNameWithoutExt}.json`);
  
  // Check if audio file needs to be uploaded to S3
  const audioKey = `audio/${audioFileName}`;
  const localAudioPath = path.join(process.cwd(), 'public', 'audio', audioFileName);
  
  // Check if audio exists in S3, if not upload it
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: audioKey
    }));
    console.log(`Audio file already exists in S3: s3://${bucketName}/${audioKey}`);
  } catch (error) {
    // Audio doesn't exist in S3, upload it
    console.log(`Uploading audio file to S3: ${audioKey}`);
    try {
      const audioContent = await fs.readFile(localAudioPath);
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: audioContent,
        ContentType: 'audio/mpeg' // Adjust based on file type
      }));
      console.log(`Audio file uploaded successfully to S3`);
    } catch (uploadError) {
      console.error('Failed to upload audio to S3:', uploadError);
      throw new Error(`Failed to upload audio file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }
  }
  
  // Check if subtitle already exists locally
  try {
    await fs.access(localSubtitlePath);
    console.log(`Subtitles already exist locally at ${localSubtitlePath}`);
    return `${audioNameWithoutExt}.json`;
  } catch {
    // Not found locally, continue
  }
  
  // Check if subtitle already exists in S3
  try {
    const s3Response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: subtitleKey
    }));
    
    // Download and save locally
    const subtitleContent = await s3Response.Body?.transformToString();
    if (subtitleContent) {
      // Ensure directory exists
      await fs.mkdir(path.dirname(localSubtitlePath), { recursive: true });
      await fs.writeFile(localSubtitlePath, subtitleContent);
      console.log(`Downloaded existing subtitles from S3 to ${localSubtitlePath}`);
      return `${audioNameWithoutExt}.json`;
    }
  } catch (error) {
    // Subtitle doesn't exist in S3, need to generate
    console.log("Subtitles not found in S3, generating with Whisper Lambda...");
  }
  
  // Invoke Whisper Lambda function
  try {
    const payload = {
      bucketName: bucketName,
      audioKey: `audio/${audioFileName}`,
      language: 'en'
    };
    
    console.log(`Invoking Whisper Lambda with payload:`, payload);
    
    const command = new InvokeCommand({
      FunctionName: process.env.WHISPER_LAMBDA_FUNCTION_NAME || 'whisper-subtitle-generator',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    
    if (response.StatusCode === 200 && response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log("Whisper Lambda response status:", result.statusCode);
      
      if (result.statusCode === 200 || result.body) {
        const body = result.body ? JSON.parse(result.body) : result;
        
        if (body.vttKey && body.subtitles) {
          // Convert VTT to JSON format
          const segments = parseVTT(body.subtitles);
          const jsonContent = JSON.stringify(segments, null, 2);
          
          // Save to S3
          await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: subtitleKey,
            Body: jsonContent,
            ContentType: 'application/json'
          }));
          
          // Save locally for immediate use
          await fs.mkdir(path.dirname(localSubtitlePath), { recursive: true });
          await fs.writeFile(localSubtitlePath, jsonContent);
          
          console.log(`Generated and saved ${segments.length} subtitle segments`);
          console.log(`Local path: ${localSubtitlePath}`);
          console.log(`S3 path: s3://${bucketName}/${subtitleKey}`);
          
          return `${audioNameWithoutExt}.json`;
        } else if (body.error) {
          console.error("Whisper Lambda error:", body.error);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error invoking Whisper Lambda:', error);
    return null;
  }
}
