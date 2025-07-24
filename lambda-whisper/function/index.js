
// Use bundled FFmpeg
const BUNDLED_FFMPEG = "/var/task/bin/ffmpeg";
process.env.PATH = `/var/task/bin:${process.env.PATH}`;
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import https from "https";

const execAsync = promisify(exec);
const s3Client = new S3Client({});

// Lambda Layer paths
const WHISPER_BIN = "/opt/bin/whisper";
const MODEL_PATH = "/opt/models/ggml-base.en.bin";
const FFMPEG_BIN = "/tmp/ffmpeg";

// Download file helper
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      require('fs').unlink(dest, () => {});
      reject(err);
    });
  });
}

// Ensure FFmpeg is available
async function ensureFFmpeg() {
  try {
    await fs.access(FFMPEG_BIN);
    console.log("FFmpeg already available");
  } catch {
    console.log("Downloading FFmpeg static binary...");
    // Using a lightweight static FFmpeg build
    const ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz";
    
    // For Lambda, we'll use a pre-extracted binary hosted somewhere
    // For now, let's use the system ffmpeg or fail gracefully
    console.log("FFmpeg not available, audio conversion may fail");
  }
}

export const handler = async (event) => {
  console.log("Whisper Lambda invoked with:", JSON.stringify(event));
  
  const { bucketName, audioKey, language = "en" } = event;
  
  if (!bucketName || !audioKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing bucketName or audioKey" })
    };
  }
  
  // Temporary file paths
  const audioFileName = path.basename(audioKey);
  const audioNameWithoutExt = audioFileName.replace(/\.[^.]+$/, "");
  const tempAudioPath = `/tmp/${audioFileName}`;
  const tempWavPath = `/tmp/${audioNameWithoutExt}.wav`;
  const outputVttPath = `/tmp/${audioNameWithoutExt}.vtt`;
  
  try {
    // Ensure FFmpeg is available
    await ensureFFmpeg();
    
    // 1. Download audio from S3 (or use URL directly)
    if (audioKey.startsWith("http")) {
      console.log(`Using audio URL directly: ${audioKey}`);
      // For URLs, download directly to temp
      await downloadFile(audioKey, tempAudioPath);
    } else {
      console.log(`Downloading audio from s3://${bucketName}/${audioKey}`);
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
      });
      
      const response = await s3Client.send(getCommand);
      const stream = response.Body;
      
      // Save stream to file
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      await fs.writeFile(tempAudioPath, Buffer.concat(chunks));
    }
    
    // 2. Try to convert to WAV format
    console.log("Attempting audio conversion...");
    let audioForWhisper = tempWavPath;
    
    try {
      // Try multiple ffmpeg locations
      const ffmpegLocations = [BUNDLED_FFMPEG, "ffmpeg", "/opt/bin/ffmpeg"];
      let ffmpegCmd = null;
      
      for (const ffmpegPath of ffmpegLocations) {
        try {
          await execAsync(`${ffmpegPath} -version`);
          ffmpegCmd = `${ffmpegPath} -i ${tempAudioPath} -ar 16000 -ac 1 -f wav ${tempWavPath} -y`;
          console.log(`Found ffmpeg at: ${ffmpegPath}`);
          break;
        } catch {
          continue;
        }
      }
      
      if (ffmpegCmd) {
        await execAsync(ffmpegCmd);
        console.log("Audio converted to WAV successfully");
      } else {
        throw new Error("FFmpeg not found");
      }
    } catch (error) {
      console.warn("FFmpeg conversion failed, using original audio:", error.message);
      audioForWhisper = tempAudioPath;
    }
    
    // 3. Run Whisper transcription
    console.log("Running Whisper transcription...");
    const whisperCmd = `${WHISPER_BIN} -m ${MODEL_PATH} -f ${audioForWhisper} -ovtt -of ${outputVttPath.replace('.vtt', '')} -l ${language}`;
    
    const { stdout, stderr } = await execAsync(whisperCmd, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 300000 // 5 minute timeout
    });
    
    if (stderr) {
      console.log("Whisper output:", stderr);
    }
    
    // 4. Read VTT output
    let vttContent;
    try {
      vttContent = await fs.readFile(outputVttPath, 'utf8');
    } catch {
      // Try without extension
      vttContent = await fs.readFile(outputVttPath.replace('.vtt', ''), 'utf8');
    }
    
    console.log("Generated VTT subtitles");
    
    // 5. Save VTT to S3
    const vttKey = `subs/${audioNameWithoutExt}.vtt`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: vttKey,
      Body: vttContent,
      ContentType: 'text/vtt'
    });
    
    await s3Client.send(putCommand);
    console.log(`Saved subtitles to s3://${bucketName}/${vttKey}`);
    
    // 6. Clean up temp files
    const filesToClean = [tempAudioPath, tempWavPath, outputVttPath, outputVttPath.replace('.vtt', '')];
    for (const file of filesToClean) {
      try {
        await fs.unlink(file);
      } catch {}
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Subtitles generated successfully',
        vttKey: vttKey,
        subtitles: vttContent
      })
    };
    
  } catch (error) {
    console.error('Error in Whisper Lambda:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error.stack
      })
    };
  }
};
