import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.REMOTION_AWS_REGION || "eu-north-1";
const BUCKET_NAME = process.env.REMOTION_S3_BUCKET_NAME;
const FUNCTION_NAME = process.env.WHISPER_LAMBDA_FUNCTION_NAME;

const lambdaClient = new LambdaClient({ 
  region: REGION,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
  }
});

const s3Client = new S3Client({ 
  region: REGION,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
  }
});

async function testWhisperLambda() {
  console.log("🧪 Testing Whisper Lambda Function");
  console.log("==================================");
  console.log(`Region: ${REGION}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Function: ${FUNCTION_NAME}`);
  console.log("");

  try {
    // Step 1: Upload a test audio file
    console.log("📤 Uploading test audio file...");
    
    // You can replace this with any audio file you have
    const audioPath = join(process.cwd(), "public", "audio", "test-audio.mp3");
    const audioKey = "test/test-audio.mp3";
    
    try {
      const audioContent = readFileSync(audioPath);
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: audioKey,
        Body: audioContent,
        ContentType: "audio/mpeg"
      }));
      console.log(`✅ Uploaded audio to s3://${BUCKET_NAME}/${audioKey}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log("⚠️  No test audio file found. Creating a test with a sample audio URL...");
        // We'll use a public audio file for testing
        audioKey = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      } else {
        throw error;
      }
    }

    // Step 2: Invoke Lambda function
    console.log("\n🚀 Invoking Lambda function...");
    
    const payload = {
      bucketName: BUCKET_NAME,
      audioKey: audioKey,
      language: "en" // or "auto" for auto-detection
    };

    const command = new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log("\n📊 Lambda Response:");
    console.log("Status Code:", response.StatusCode);
    
    if (response.StatusCode === 200) {
      if (result.errorMessage) {
        console.error("❌ Lambda Error:", result.errorMessage);
      } else {
        console.log("✅ Success!");
        console.log("\n📝 Generated Subtitles:");
        console.log("========================");
        console.log(result.subtitles || result.body || JSON.stringify(result, null, 2));
        
        if (result.vttKey) {
          console.log(`\n📍 Subtitles saved to: s3://${BUCKET_NAME}/${result.vttKey}`);
        }
      }
    } else {
      console.error("❌ Lambda invocation failed");
      console.error(result);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  }
}

// Run the test
testWhisperLambda();
