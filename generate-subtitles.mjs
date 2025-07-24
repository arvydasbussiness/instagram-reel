import { generateSubtitles } from './src/lib/whisper-subtitles.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function generateSubtitlesForFile(audioPath: string, outputPath: string) {
  try {
    console.log(`🎙️  Processing: ${audioPath}`);
    
    // Read audio file
    const audioBuffer = readFileSync(audioPath);
    
    // Generate subtitles
    const subtitles = await generateSubtitles({
      audioBuffer,
      language: 'en', // or 'auto' for auto-detection
      maxDuration: 3, // Good for Instagram reels
    });
    
    console.log(`✅ Generated ${subtitles.length} subtitle segments`);
    
    // Save as JSON
    writeFileSync(outputPath, JSON.stringify(subtitles, null, 2));
    console.log(`💾 Saved to: ${outputPath}`);
    
    // Also save as VTT format
    const vttPath = outputPath.replace('.json', '.vtt');
    const vttContent = convertToVTT(subtitles);
    writeFileSync(vttPath, vttContent);
    console.log(`💾 Saved VTT to: ${vttPath}`);
    
    return subtitles;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

function convertToVTT(subtitles: any[]): string {
  let vtt = 'WEBVTT\n\n';
  
  subtitles.forEach((sub, index) => {
    const startTime = formatTime(sub.start);
    const endTime = formatTime(sub.end);
    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${sub.text}\n\n`;
  });
  
  return vtt;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;
}

// Example usage
async function main() {
  const audioFile = process.argv[2];
  if (!audioFile) {
    console.log('Usage: node generate-subtitles.mjs <audio-file>');
    console.log('Example: node generate-subtitles.mjs public/audio/my-audio.mp3');
    process.exit(1);
  }
  
  const outputPath = audioFile.replace(/\.(mp3|wav|m4a|ogg)$/i, '-subtitles.json');
  await generateSubtitlesForFile(audioFile, outputPath);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSubtitlesForFile };
