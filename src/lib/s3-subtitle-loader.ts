import { staticFile } from 'remotion';

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// Cache for loaded subtitles
const subtitleCache: Record<string, SubtitleSegment[]> = {};

/**
 * Load subtitles - tries multiple approaches
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
    // In Remotion Lambda, files in public/ are bundled with the site
    // Try to load from the bundled assets first
    try {
      const staticUrl = staticFile(`subs/${subtitleKey}`);
      console.log(`Trying to load subtitles from static file: ${staticUrl}`);
      
      const response = await fetch(staticUrl);
      if (response.ok) {
        const subtitles = await response.json() as SubtitleSegment[];
        
        // Validate format
        if (!Array.isArray(subtitles)) {
          throw new Error('Invalid subtitle format: expected array');
        }
        
        // Cache the result
        subtitleCache[cacheKey] = subtitles;
        
        console.log(`Loaded ${subtitles.length} subtitle segments from static file`);
        return subtitles;
      }
    } catch (staticError) {
      console.log('Static file approach failed:', staticError);
    }

    // If static file fails, throw error
    throw new Error('Failed to load subtitles - ensure subtitles are in public/subs/ directory');

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
