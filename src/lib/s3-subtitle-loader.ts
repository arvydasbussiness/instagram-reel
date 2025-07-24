import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

// Create S3 client inside function to ensure env vars are loaded
function createS3Client() {
  // Multiple ways to detect Lambda environment
  const isLambda = !!(
    process.env.AWS_LAMBDA_FUNCTION_NAME || 
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV?.includes('AWS_Lambda')
  );
  
  const isRemotionLambda = process.env.REMOTION_LAMBDA === '1';
  
  console.log('S3 Client Environment Detection:', {
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || 'not set',
    LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT || 'not set',
    AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV || 'not set',
    REMOTION_LAMBDA: process.env.REMOTION_LAMBDA || 'not set',
    isLambda,
    isRemotionLambda
  });
  
  // In Lambda or Remotion Lambda environment
  if (isLambda || isRemotionLambda) {
    console.log('Creating S3 client for Lambda environment - using default provider chain');
    return new S3Client({
      region: process.env.AWS_REGION || process.env.REMOTION_AWS_REGION || "eu-north-1",
      credentials: fromNodeProviderChain()
    });
  }
  
  // In development/local, use explicit credentials
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || "eu-north-1";

  console.log('Creating S3 client for non-Lambda environment');
  
  // Only pass credentials if they exist
  const clientConfig: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  } = {
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
    throw error; // Re-throw the error instead of falling back to local files
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
