# Audio Files Directory

Place your audio files (background music, sound effects, voiceovers) in this directory to use them in your Instagram Reel compositions.

## How to use:

1. Copy your audio file (e.g., `background-music.mp3`) to this folder
2. Update the audio properties in `/src/remotion/InstagramReel/constants.ts`:
   ```typescript
   audioSource: "background-music.mp3",
   isAudioLocal: true,
   audioVolume: 0.8,
   ```

## Supported formats:
- MP3 (recommended)
- WAV
- OGG
- M4A
- AAC

## Audio Properties:

- **audioSource**: Filename of your audio file
- **isAudioLocal**: Set to `true` for local files, `false` for URLs
- **audioVolume**: Volume level from 0 (mute) to 1 (full volume)
- **audioStartFrom**: Start playing audio from a specific frame (optional)
- **audioEndAt**: Stop playing audio at a specific frame (optional)
- **audioDelay**: Delay audio start by number of frames (default: 0)

## Examples:

### Basic background music:
```typescript
audioSource: "chill-beats.mp3",
isAudioLocal: true,
audioVolume: 0.5,
```

### Trimmed audio (play only middle section):
```typescript
audioSource: "long-song.mp3",
isAudioLocal: true,
audioVolume: 0.7,
audioStartFrom: 150,  // Start at 5 seconds (30fps)
audioEndAt: 450,      // End at 15 seconds
```

### Delayed audio (starts after intro):
```typescript
audioSource: "voiceover.mp3",
isAudioLocal: true,
audioVolume: 1,
audioDelay: 90,  // Start after 3 seconds
```

## Note:
- When you add custom audio, the original video audio will be automatically muted
- Audio files in this folder will be included in your build
- For best results, use compressed audio formats and appropriate bitrates
