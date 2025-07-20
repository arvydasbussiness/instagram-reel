# Video Files Directory

Place your test video files in this directory to use them in your Instagram Reel compositions.

## How to use:

1. Copy your video file (e.g., `my-video.mp4`) to this folder
2. Update the `videoSource` in `/src/remotion/InstagramReel/constants.ts` to match your filename
3. Make sure `isLocalFile` is set to `true`

## Supported formats:
- MP4 (recommended)
- WebM
- MOV

## Example:
If you place a file called `test-reel.mp4` in this folder, update your constants to:
```typescript
videoSource: "test-reel.mp4",
isLocalFile: true,
```

## Note:
Videos in this folder will be included in your build, so use appropriate file sizes for testing.
