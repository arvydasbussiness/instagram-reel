import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || process.env.REMOTION_AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const bucketName = process.env.REMOTION_S3_BUCKET_NAME || 'whisper-lambda-remotion-101';

async function listSubtitles() {
  console.log('📋 Listing subtitles in S3 bucket');
  console.log('================================');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Region: ${process.env.AWS_REGION || "eu-north-1"}`);
  console.log('');

  try {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'subs/'
    }));

    if (response.Contents && response.Contents.length > 0) {
      console.log(`Found ${response.Contents.length} subtitle files:\n`);
      
      response.Contents.forEach(obj => {
        console.log(`📄 ${obj.Key}`);
        console.log(`   Size: ${(obj.Size / 1024).toFixed(2)} KB`);
        console.log(`   Modified: ${obj.LastModified}`);
        console.log('');
      });
      
      console.log('✅ Subtitles are available in S3 for Lambda rendering');
      console.log('\nTo use in render request:');
      console.log('{');
      console.log('  "id": "InstagramReel",');
      console.log('  "inputProps": {');
      console.log('    "videoSource": "test-video.mp4",');
      console.log('    "audioSource": "test-audio.mp3",');
      console.log(`    "subtitlesFile": "${response.Contents[0].Key.replace('subs/', '')}"`);
      console.log('  }');
      console.log('}');
    } else {
      console.log('❌ No subtitle files found in S3');
      console.log('\nMake sure to:');
      console.log('1. Generate subtitles first by rendering with audioSource');
      console.log('2. Check the correct bucket name in .env');
    }
  } catch (error) {
    console.error('❌ Error listing S3:', error.message);
  }
}

listSubtitles();
