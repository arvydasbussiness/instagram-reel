import React from 'react';
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

// Props interface for the Instagram Reel component
export interface InstagramReelProps {
  videoSource: string; // Can be a URL or a local file name
  isLocalFile?: boolean; // Flag to indicate if it's a local file
}

export const InstagramReel: React.FC<InstagramReelProps> = ({ 
  videoSource, 
  isLocalFile = true // Default to local file for testing
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Determine the video source
  const videoSrc = isLocalFile 
    ? staticFile(`videos/${videoSource}`) 
    : videoSource;

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
        />
      </AbsoluteFill>

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
          Frame: {frame} / {durationInFrames}
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
