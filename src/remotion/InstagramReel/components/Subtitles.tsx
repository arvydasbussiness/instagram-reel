import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export interface SubtitleSegment {
  text: string;
  start: number; // start time in seconds
  end: number; // end time in seconds
}

interface SubtitlesProps {
  segments: SubtitleSegment[];
  style?: React.CSSProperties;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ segments, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find the current subtitle segment
  const currentSegment = segments.find(
    (segment) => currentTime >= segment.start && currentTime <= segment.end
  );

  if (!currentSegment) {
    return null;
  }

  // Calculate progress for animation
  const segmentStartFrame = currentSegment.start * fps;
  const segmentEndFrame = currentSegment.end * fps;  
  // Entrance animation
  const entranceProgress = spring({
    frame: frame - segmentStartFrame,
    fps,
    config: {
      damping: 30,
      mass: 0.5,
    },
  });

  // Exit animation
  const exitProgress = spring({
    frame: frame - segmentEndFrame + 10,
    fps,
    config: {
      damping: 30,
      mass: 0.5,
    },
  });

  const opacity = interpolate(
    frame,
    [segmentStartFrame, segmentStartFrame + 10, segmentEndFrame - 10, segmentEndFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const scale = interpolate(entranceProgress, [0, 1], [0.8, 1]);
  const y = interpolate(entranceProgress, [0, 1], [20, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '15%',
        left: '10%',
        right: '10%',
        textAlign: 'center',
        opacity,
        transform: `scale(${scale}) translateY(${y}px)`,
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          fontSize: '28px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          lineHeight: 1.4,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          ...style,
        }}
      >
        {currentSegment.text}
      </div>
    </div>
  );
};