# Whisper Lambda for Subtitle Generation

This Lambda function generates subtitles from audio files using OpenAI's Whisper model.

## Features

- Transcribes audio files (MP3, WAV, etc.) to WebVTT subtitles
- Converts audio to proper format using FFmpeg
- Saves subtitles to S3 for use in Remotion rendering
- Supports multiple languages

## Architecture

- **Lambda Function**: Processes audio and generates subtitles
- **Lambda Layer**: Contains Whisper.cpp binary and model
- **FFmpeg**: Bundled in the function for audio conversion
- **S3**: Stores input audio and output subtitles

## Deployment

```bash
# Deploy the Lambda function and infrastructure
node deploy.mjs

# Or on Windows
deploy.bat
```

## Configuration

Set these in your `.env` file:
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-north-1
REMOTION_S3_BUCKET_NAME=your-bucket-name
```

## Files

- `cloudformation.yaml` - AWS infrastructure definition
- `deploy.mjs` - Deployment script
- `function/index.js` - Lambda function code
- `layer/` - Contains Whisper binary and model
- `whisper-layer.zip` - Built layer package
- `whisper-function.zip` - Built function package

## Usage

The Lambda expects:
```json
{
  "bucketName": "your-bucket",
  "audioKey": "audio/file.mp3",
  "language": "en"
}
```

Returns:
```json
{
  "vttKey": "subs/file.vtt",
  "subtitles": "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\n..."
}
```

## Building the Layer

If you need to rebuild the Whisper layer:
```bash
# In WSL or Linux
./build-layer.sh
```

This creates `whisper-layer.zip` with the Whisper binary and model.
