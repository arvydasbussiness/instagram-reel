import { SubtitleSegment } from '../remotion/InstagramReel/components/Subtitles';

// Example subtitle data - replace with your actual transcription
export const exampleSubtitles: SubtitleSegment[] = [
  {
    text: "Welcome to my Instagram reel!",
    start: 0,
    end: 2.5,
  },
  {
    text: "Today we're going to explore",
    start: 2.5,
    end: 4.5,
  },
  {
    text: "some amazing features",
    start: 4.5,
    end: 6.5,
  },
  {
    text: "that will blow your mind!",
    start: 6.5,
    end: 8.5,
  },
  {
    text: "Let's get started!",
    start: 8.5,
    end: 10,
  },
];

// Function to format SRT-style subtitles to our format
export function parseSRT(srtContent: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const blocks = srtContent.trim().split('\n\n');

  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (timeMatch) {
        const startTime = 
          parseInt(timeMatch[1]) * 3600 + 
          parseInt(timeMatch[2]) * 60 + 
          parseInt(timeMatch[3]) + 
          parseInt(timeMatch[4]) / 1000;
        
        const endTime = 
          parseInt(timeMatch[5]) * 3600 + 
          parseInt(timeMatch[6]) * 60 + 
          parseInt(timeMatch[7]) + 
          parseInt(timeMatch[8]) / 1000;
        
        const text = lines.slice(2).join(' ');
        
        segments.push({ text, start: startTime, end: endTime });
      }
    }
  });

  return segments;
}