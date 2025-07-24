import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SubtitleSegment } from '../lib/whisper-subtitles';

interface SubtitlesProps {
  subtitles: SubtitleSegment[];
  style?: React.CSSProperties;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ subtitles, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current subtitle
  const currentSubtitle = subtitles.find(
    sub => currentTime >= sub.start && currentTime <= sub.end
  );

  if (!currentSubtitle) return null;

  // Animation progress (0 to 1) within the subtitle duration
  const progress = (currentTime - currentSubtitle.start) / (currentSubtitle.end - currentSubtitle.start);
  
  // Fade in/out animation
  const fadeIn = spring({
    fps,
    frame: frame - currentSubtitle.start * fps,
    config: {
      damping: 200,
      mass: 0.5,
    },
  });

  const fadeOut = interpolate(
    progress,
    [0, 0.8, 1],
    [1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const opacity = fadeIn * fadeOut;

  // Split text into words for word-by-word animation
  const words = currentSubtitle.text.split(' ');
  const wordsPerFrame = words.length / ((currentSubtitle.end - currentSubtitle.start) * fps);
  const visibleWords = Math.floor((frame - currentSubtitle.start * fps) * wordsPerFrame);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        textAlign: 'center',
        zIndex: 10,
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '20px 30px',
          borderRadius: '10px',
          opacity,
        }}
      >
        <p
          style={{
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            lineHeight: 1.4,
          }}
        >
          {words.slice(0, visibleWords + 1).join(' ')}
        </p>
      </div>
    </div>
  );
};

// Modern Instagram-style subtitles
export const InstagramSubtitles: React.FC<SubtitlesProps> = ({ subtitles, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentSubtitle = subtitles.find(
    sub => currentTime >= sub.start && currentTime <= sub.end
  );

  if (!currentSubtitle) return null;

  const progress = (currentTime - currentSubtitle.start) / (currentSubtitle.end - currentSubtitle.start);
  
  // Bounce animation
  const scale = spring({
    fps,
    frame: frame - currentSubtitle.start * fps,
    config: {
      damping: 10,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const opacity = interpolate(
    progress,
    [0, 0.1, 0.9, 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Split into words for highlighting
  const words = currentSubtitle.text.split(' ');
  const currentWordIndex = Math.floor(progress * words.length);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        width: '90%',
        textAlign: 'center',
        zIndex: 10,
        ...style,
      }}
    >
      <div
        style={{
          opacity,
        }}
      >
        {words.map((word, index) => (
          <span
            key={index}
            style={{
              color: index <= currentWordIndex ? '#FFD700' : 'white',
              fontSize: '42px',
              fontWeight: '900',
              margin: '0 4px',
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9)',
              display: 'inline-block',
              transform: index === currentWordIndex ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.2s ease',
              fontFamily: 'Arial Black, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};
