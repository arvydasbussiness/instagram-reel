import React from 'react';
import { 
  AbsoluteFill, 
  OffthreadVideo, 
  Audio,
  useCurrentFrame, 
  useVideoConfig, 
  staticFile,
  Sequence
} from 'remotion';

// Props interface for the Instagram Reel component
export interface InstagramReelProps {
  videoSource: string; // Can be a URL or a local file name
  isLocalFile?: boolean; // Flag to indicate if it's a local file
  audioSource?: string; // Optional audio file
  isAudioLocal?: boolean; // Flag for audio file location
  audioVolume?: number; // Audio volume (0-1)
  audioStartFrom?: number; // Start audio from specific frame
  audioEndAt?: number; // End audio at specific frame
  audioDelay?: number; // Delay audio by frames
}

export const InstagramReel: React.FC<InstagramReelProps> = ({ 
  videoSource, 
  isLocalFile = true,
  audioSource,
  isAudioLocal = true,
  audioVolume = 1,
  audioStartFrom,
  audioEndAt,
  audioDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Determine the video source
  const videoSrc = isLocalFile 
    ? staticFile(`videos/${videoSource}`) 
    : videoSource;

  // Determine the audio source if provided
  const audioSrc = audioSource
    ? (isAudioLocal ? staticFile(`audio/${audioSource}`) : audioSource)
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Main video layer */}
      <AbsoluteFill>
        <OffthreadVideo
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          // Always mute to allow autoplay
          muted
          // Control volume based on whether we have custom audio
          volume={audioSource ? 0 : 1}
        />
      </AbsoluteFill>

      {/* Audio layer - only render if audioSource is provided and not empty */}
      {audioSrc && audioSource && audioSource.trim() !== '' && (
        <Sequence from={audioDelay}>
          <Audio
            src={audioSrc}
            volume={audioVolume}
            startFrom={audioStartFrom}
            endAt={audioEndAt}
          />
        </Sequence>
      )}

      {/* Debug info for testing */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          padding: 20,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: 5,
            fontSize: 14,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div>Frame: {frame} / {durationInFrames}</div>
          {audioSource && audioSource.trim() !== '' && (
            <div style={{ marginTop: 5, fontSize: 12 }}>
              Audio: {audioSource} (Vol: {audioVolume})
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* You can add overlays, text, effects here later */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 50,
        }}
      >
        {/* Add your text overlays, animations, etc. here */}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
