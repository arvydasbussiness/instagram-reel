# Essential Files for Instagram Reel Subtitle Functionality

## Core Subtitle System Files

### 1. **Backend/API**
- `src/app/api/lambda/render/route.ts` - Main render endpoint that triggers subtitle generation
- `src/helpers/generate-subtitles-whisper-lambda.ts` - Calls Whisper Lambda and saves subtitles to S3

### 2. **Subtitle Loading & Display**
- `src/lib/s3-subtitle-loader.ts` - Loads subtitles from S3 during rendering
- `src/components/Subtitles.tsx` - React component for displaying subtitles (Instagram & classic styles)

### 3. **Main Composition**
- `src/remotion/InstagramReel/InstagramReel.tsx` - Main Instagram reel component (should be the S3 version)
- `src/remotion/InstagramReel/constants.ts` - Default props and configuration
- `src/remotion/Root.tsx` - Registers all compositions

### 4. **Lambda Function** (in `lambda-whisper/`)
- `function/index.js` - Lambda function code with FFmpeg support
- `deploy.mjs` - Deployment script
- `cloudformation.yaml` - Infrastructure as code
- Your Whisper layer and configuration

### 5. **Configuration**
- `.env` - Contains AWS credentials and configuration:
  ```
  REMOTION_AWS_ACCESS_KEY_ID=xxx
  REMOTION_AWS_SECRET_ACCESS_KEY=xxx
  REMOTION_AWS_REGION=eu-north-1
  WHISPER_LAMBDA_FUNCTION_NAME=whisper-subtitle-generator
  REMOTION_S3_BUCKET_NAME=whisper-lambda-remotion-101
  ```

### 6. **Useful Scripts** (keep these)
- `test-whisper-lambda.mjs` - Test Whisper Lambda directly
- `generate-subtitles.mjs` - Generate subtitles for any audio file
- `list-s3-subtitles.mjs` - List subtitles stored in S3
- `test-complete-workflow.ps1` - Test the entire workflow
- `test-render-subtitles.ps1` - Quick render test

## How It All Works Together

1. **Render Request** → API endpoint (`route.ts`)
2. **Generate Subtitles** → Whisper Lambda (`generate-subtitles-whisper-lambda.ts`)
3. **Save to S3** → As JSON in `subs/` prefix
4. **Load During Render** → S3 loader (`s3-subtitle-loader.ts`)
5. **Display in Video** → Subtitle component (`Subtitles.tsx`)

## Important Notes

- Make sure `InstagramReel.tsx` is the S3 version (copy from `InstagramReelS3.tsx`)
- Subtitles are stored in S3 at: `s3://your-bucket/subs/audio-name.json`
- The system automatically generates subtitles when `audioSource` is provided but `subtitlesFile` is empty
- Debug mode (`showDebugInfo: true`) shows subtitle loading status

## Quick Test

```bash
curl -X POST http://localhost:3000/api/lambda/render \
  -H "Content-Type: application/json" \
  -d '{
    "id": "InstagramReel",
    "inputProps": {
      "videoSource": "test-video.mp4",
      "audioSource": "test-audio.mp3",
      "showDebugInfo": true
    }
  }'
```

This will automatically generate subtitles and render the video with them!
