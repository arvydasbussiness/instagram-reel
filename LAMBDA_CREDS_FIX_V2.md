# Lambda Credentials Fix - Updated

## What was fixed:
1. Used `getRemotionEnvironment()` to properly detect the rendering environment
2. In render/Lambda environment (!isStudio && !isPlayer): Uses default AWS credentials from Lambda execution role
3. In Studio/Player: Uses explicit credentials from environment variables

## Key changes:
- `s3-subtitle-loader.ts`: Uses `getRemotionEnvironment()` to detect environment
- `generate-subtitles-whisper-lambda.ts`: Uses Lambda environment variables to detect Lambda

## Deploy the fix:
```bash
npm run deploy
# or
node deploy.mjs
```

## How it works now:
- **In Lambda**: No explicit credentials - uses IAM role attached to Lambda function
- **In Studio/Player**: Uses REMOTION_AWS_* environment variables
- **Local file fallback**: Still works in Studio when S3 fails

The credential error should now be resolved!
