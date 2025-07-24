import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// Cache for loaded subtitles
const subtitleCache: Record<string, SubtitleSegment[]> = {};

/**
 * Load subtitles from S3 during render
 * This works in both local and Lambda environments
 */
export async function loadSubtitlesFromS3(
  subtitleKey: string,
  bucketName?: string
): Promise<SubtitleSegment[]> {
  // Use cache if available
  const cacheKey = `${bucketName}/${subtitleKey}`;
  if (subtitleCache[cacheKey]) {
    console.log(`Using cached subtitles for ${cacheKey}`);
    return subtitleCache[cacheKey];
  }

  try {
    // Determine bucket name - might be the Remotion render bucket
    const bucket = bucketName || 
      process.env.REMOTION_S3_BUCKET_NAME || 
      process.env.REMOTION_APP_BUCKET_NAME ||
      'whisper-lambda-remotion-101';

    // Try to get bucket from the site URL if available
    const siteUrl = process.env.REMOTION_SERVE_URL;
    if (!bucketName && siteUrl && siteUrl.includes('s3')) {
      // Extract bucket from URL like https://remotionlambda-xxx.s3.region.amazonaws.com/
      const match = siteUrl.match(/https:\/\/([^.]+)\.s3\./);
      if (match) {
        const remotionBucket = match[1];
        console.log(`Detected Remotion bucket from serve URL: ${remotionBucket}`);
        // But still use our whisper bucket for subtitles
      }
    }

    // Construct S3 key
    const s3Key = subtitleKey.startsWith('subs/') ? subtitleKey : `subs/${subtitleKey}`;
    
    console.log(`Loading subtitles from S3: s3://${bucket}/${s3Key}`);
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
      REMOTION_SERVE_URL: process.env.REMOTION_SERVE_URL,
    });

    // Create S3 client with minimal configuration
    // In Lambda, this will use the execution role
    // In local dev, this will use environment variables
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || process.env.REMOTION_AWS_REGION || 'eu-north-1'
    });

    // Get from S3
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key
    }));

    // Read the response
    const bodyString = await response.Body?.transformToString();
    if (!bodyString) {
      throw new Error('Empty response from S3');
    }

    // Parse JSON
    const subtitles = JSON.parse(bodyString) as SubtitleSegment[];
    
    // Validate format
    if (!Array.isArray(subtitles)) {
      throw new Error('Invalid subtitle format: expected array');
    }

    // Cache the result
    subtitleCache[cacheKey] = subtitles;
    
    console.log(`Loaded ${subtitles.length} subtitle segments from S3`);
    return subtitles;

  } catch (error) {
    console.error('Error loading subtitles from S3:', error);
    throw error;
  }
}

/**
 * Get subtitle at current time
 */
export function getSubtitleAtTime(
  subtitles: SubtitleSegment[], 
  currentTimeInSeconds: number
): SubtitleSegment | null {
  return subtitles.find(
    sub => currentTimeInSeconds >= sub.start && currentTimeInSeconds <= sub.end
  ) || null;
}
