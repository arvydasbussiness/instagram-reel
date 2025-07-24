import { subtitles } from '../data/subtitles';

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// Cache for loaded subtitles
const subtitleCache: Record<string, SubtitleSegment[]> = {};

/**
 * Load subtitles from embedded data
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
    // Load from embedded data
    const subtitleData = subtitles[subtitleKey];
    
    if (!subtitleData) {
      console.error(`Subtitle file not found: ${subtitleKey}`);
      console.log('Available subtitle files:', Object.keys(subtitles));
      throw new Error(`Subtitle file not found in embedded data: ${subtitleKey}`);
    }
    
    // Validate format
    if (!Array.isArray(subtitleData)) {
      throw new Error('Invalid subtitle format: expected array');
    }
    
    // Cache the result
    subtitleCache[cacheKey] = subtitleData;
    
    console.log(`Loaded ${subtitleData.length} subtitle segments from embedded data`);
    return subtitleData;

  } catch (error) {
    console.error('Error loading subtitles:', error);
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
