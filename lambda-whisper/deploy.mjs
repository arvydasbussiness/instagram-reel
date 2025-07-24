import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  PublishLayerVersionCommand,
  ListLayerVersionsCommand,
} from "@aws-sdk/client-lambda";
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from "@aws-sdk/client-cloudformation";
import { execSync } from "child_process";
import { readFileSync, existsSync, createReadStream, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const REGION = process.env.AWS_REGION || "eu-north-1";
const STACK_NAME = "whisper-lambda-stack";
const FUNCTION_NAME = "whisper-subtitle-generator";
const LAYER_NAME = "whisper-cpp-layer";

// Clients with enhanced configuration
const lambdaClient = new LambdaClient({ region: REGION });
const s3Client = new S3Client({ 
  region: REGION,
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 60000,
    socketTimeout: 60000,
  }
});
const cfClient = new CloudFormationClient({ region: REGION });

console.log("🎯 Deploying Whisper Lambda");
console.log("Region:", REGION);

// Check AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID && !process.env.REMOTION_AWS_ACCESS_KEY_ID) {
  console.error('❌ AWS credentials not found.');
  console.error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
  process.exit(1);
}

async function ensureBucket(bucketName) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Using existing bucket: ${bucketName}`);
  } catch (error) {
    if (error.name === 'NotFound') {
      console.log(`📦 Creating bucket: ${bucketName}`);
      try {
        await s3Client.send(new CreateBucketCommand({
          Bucket: bucketName,
          ...(REGION !== 'us-east-1' && {
            CreateBucketConfiguration: { LocationConstraint: REGION }
          })
        }));
        console.log(`✅ Bucket created successfully`);
      } catch (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        console.error('Full error:', createError);
        throw createError;
      }
    } else {
      console.error('❌ Error checking bucket:', error.message);
      throw error;
    }
  }
}

async function buildLayer() {
  const layerZipPath = join(__dirname, "whisper-layer.zip");
  
  if (!existsSync(layerZipPath)) {
    console.error("❌ whisper-layer.zip not found!");
    console.error("Please run build-layer.sh first:");
    console.error("  On Linux/Mac: ./build-layer.sh");
    console.error("  On Windows: wsl ./build-layer.sh");
    process.exit(1);
  }
  
  return layerZipPath;
}

async function buildFunction() {
  console.log("📦 Building Lambda function...");
  
  const functionDir = join(__dirname, "function");
  process.chdir(functionDir);
  
  // Install dependencies
  console.log("Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
  
  // Create zip
  console.log("Creating function zip...");
  
  // Check if we're on Windows
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Use PowerShell on Windows
    execSync(`powershell -Command "Compress-Archive -Path 'index.js', 'package.json', 'package-lock.json', 'node_modules' -DestinationPath '../whisper-function.zip' -Force"`, {
      stdio: "inherit",
      shell: true
    });
  } else {
    // Use zip command on Unix-like systems
    execSync("zip -r ../whisper-function.zip index.js package.json package-lock.json node_modules", {
      stdio: "inherit",
      shell: true
    });
  }
  
  process.chdir(__dirname);
  return join(__dirname, "whisper-function.zip");
}

async function uploadToS3(bucketName, key, filePath) {
  console.log(`📤 Checking ${key} in S3...`);
  
  // Retry mechanism for connection issues
  let retries = 3;
  while (retries > 0) {
    try {
      // Check if file already exists
      try {
        const response = await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: key
        }));
        const existingSizeMB = (response.ContentLength / 1024 / 1024).toFixed(2);
        console.log(`✅ ${key} already exists in S3 (${existingSizeMB} MB)`);
        return; // Skip upload
      } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          console.log(`📤 Uploading ${key} to S3...`);
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          console.log(`⚠️  Connection error while checking ${key}, retrying...`);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          }
          throw error;
        } else {
          throw error;
        }
      }
      
      const fileStats = statSync(filePath);
      const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
      console.log(`   File size: ${fileSizeMB} MB`);
      
      // For large files, read the entire file into memory
      const fileContent = readFileSync(filePath);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentLength: fileStats.size,
      }));
      console.log(`✅ Uploaded ${key} successfully`);
      return; // Success, exit the function
      
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        retries--;
        if (retries > 0) {
          console.log(`⚠️  Connection error during upload, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          continue;
        }
      }
      throw error;
    }
  }
}

async function deployStack(bucketName) {
  console.log("🚀 Deploying CloudFormation stack...");
  
  const templateBody = readFileSync(join(__dirname, "cloudformation.yaml"), "utf8");
  
  const params = {
    StackName: STACK_NAME,
    TemplateBody: templateBody,
    Parameters: [
      {
        ParameterKey: "BucketName",
        ParameterValue: bucketName,
      },
    ],
    Capabilities: ["CAPABILITY_IAM"],
  };
  
  try {
    // Check if stack exists
    await cfClient.send(new DescribeStacksCommand({ StackName: STACK_NAME }));
    
    // Update existing stack
    console.log("Updating existing stack...");
    await cfClient.send(new UpdateStackCommand(params));
    await waitUntilStackUpdateComplete(
      { client: cfClient, maxWaitTime: 600 },
      { StackName: STACK_NAME }
    );
  } catch (error) {
    if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
      // Create new stack
      console.log("Creating new stack...");
      await cfClient.send(new CreateStackCommand(params));
      await waitUntilStackCreateComplete(
        { client: cfClient, maxWaitTime: 600 },
        { StackName: STACK_NAME }
      );
    } else if (error.message?.includes('No updates are to be performed')) {
      console.log("✅ Stack is already up to date");
      return;
    } else {
      throw error;
    }
  }
  
  console.log("✅ Stack deployed successfully!");
}

async function getStackOutputs() {
  const response = await cfClient.send(new DescribeStacksCommand({
    StackName: STACK_NAME
  }));
  
  const outputs = {};
  response.Stacks[0].Outputs?.forEach(output => {
    outputs[output.OutputKey] = output.OutputValue;
  });
  
  return outputs;
}

async function main() {
  try {
    // Get or prompt for bucket name
    let bucketName = process.env.REMOTION_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error("❌ REMOTION_S3_BUCKET_NAME not found in .env");
      console.error("Please add: REMOTION_S3_BUCKET_NAME=your-bucket-name");
      process.exit(1);
    }
    
    // Ensure bucket exists
    await ensureBucket(bucketName);
    
    // Build layer and function
    const layerZipPath = await buildLayer();
    const functionZipPath = await buildFunction();
    
    // Upload to S3
    await uploadToS3(bucketName, "layers/whisper-layer.zip", layerZipPath);
    await uploadToS3(bucketName, "functions/whisper-function.zip", functionZipPath);
    
    // Deploy CloudFormation stack
    await deployStack(bucketName);
    
    // Get outputs
    const outputs = await getStackOutputs();
    
    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Stack Outputs:");
    console.log(`Function Name: ${outputs.WhisperFunctionName || FUNCTION_NAME}`);
    console.log(`Function ARN: ${outputs.WhisperFunctionArn}`);
    console.log(`Layer ARN: ${outputs.LayerArn}`);
    
    console.log("\n📝 Next steps:");
    console.log("1. Add to your .env file:");
    console.log(`   WHISPER_LAMBDA_FUNCTION_NAME=${outputs.WhisperFunctionName || FUNCTION_NAME}`);
    console.log(`   REMOTION_S3_BUCKET_NAME=${bucketName}`);
    console.log("\n2. Test the function:");
    console.log(`   aws lambda invoke --function-name ${FUNCTION_NAME} --payload '{"bucketName":"${bucketName}","audioKey":"audio/test-audio.mp3"}' output.json`);
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run deployment
main();
