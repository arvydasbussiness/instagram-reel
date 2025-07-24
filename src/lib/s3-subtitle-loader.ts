import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getRemotionEnvironment } from 'remotion';

// Create S3 client inside function to ensure env vars are loaded
function createS3Client() {
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || "eu-north-1";

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

  return new S3Client(clientConfig);
}

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

  // Create S3 client
  const s3Client = createS3Client();

  try {
    // Determine bucket name
    const bucket = bucketName || 
      process.env.REMOTION_S3_BUCKET_NAME || 
      process.env.REMOTION_APP_BUCKET_NAME ||
      'whisper-lambda-remotion-101';

    // Construct S3 key
    const s3Key = subtitleKey.startsWith('subs/') ? subtitleKey : `subs/${subtitleKey}`;
    
    console.log(`Loading subtitles from S3: s3://${bucket}/${s3Key}`);

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
    
    // In development, try loading from local file as fallback
    const env = getRemotionEnvironment();
    if (env.isStudio || env.isPlayer) {
      try {
        console.log('Attempting to load from local file...');
        const { staticFile } = await import('remotion');
        const response = await fetch(staticFile(`subs/${subtitleKey}`));
        const data = await response.json();
        subtitleCache[cacheKey] = data;
        return data;
      } catch (localError) {
        console.error('Local file fallback failed:', localError);
      }
    }
    
    return [];
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
