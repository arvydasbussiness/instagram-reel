import React from 'react';
import { 
  AbsoluteFill, 
  OffthreadVideo, 
  Audio,
  useCurrentFrame, 
  useVideoConfig, 
  staticFile,
  Sequence,
  continueRender,
  delayRender
} from 'remotion';
import { loadSubtitlesFromS3, SubtitleSegment, getSubtitleAtTime } from '../../lib/s3-subtitle-loader';
import { z } from 'zod';
import { CompositionProps } from '../../../types/constants';

export type InstagramReelProps = z.infer<typeof CompositionProps>;

// Simple subtitle renderer
const SubtitleDisplay: React.FC<{ 
  subtitle: SubtitleSegment | null; 
  style: 'instagram' | 'classic';
}> = ({ subtitle, style }) => {
  if (!subtitle) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: style === 'instagram' ? '15%' : '10%',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: style === 'instagram' ? '20px 40px' : '15px 30px',
          borderRadius: style === 'instagram' ? 15 : 8,
          maxWidth: '90%',
          textAlign: 'center',
          border: style === 'instagram' ? '3px solid rgba(255, 215, 0, 0.3)' : 'none',
        }}
      >
        <span
          style={{
            color: style === 'instagram' ? '#FFD700' : '#FFFFFF',
            fontSize: style === 'instagram' ? 48 : 36,
            fontWeight: style === 'instagram' ? '900' : '700',
            // eslint-disable-next-line @remotion/slow-css-property
            textShadow: style === 'instagram' 
              ? '4px 4px 8px rgba(0, 0, 0, 0.9)' 
              : '2px 2px 4px rgba(0, 0, 0, 0.8)',
            fontFamily: style === 'instagram' 
              ? 'Arial Black, sans-serif' 
              : 'Arial, sans-serif',
            textTransform: style === 'instagram' ? 'uppercase' : 'none',
            letterSpacing: style === 'instagram' ? '1px' : '0',
          }}
        >
          {subtitle.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const InstagramReel: React.FC<InstagramReelProps> = ({ 
  videoSource, 
  isLocalFile = true,
  audioSource,
  isAudioLocal = true,
  audioVolume = 1,
  audioStartFrom,
  audioEndAt,
  audioDelay = 0,
  subtitlesFile,
  subtitleData, // New prop for direct subtitle data
  subtitleStyle = 'instagram',
  showDebugInfo = false,
  bucketName,
}) => {
  // Debug logging
  console.log('InstagramReel props received:', {
    subtitlesFile,
    subtitleData: subtitleData ? `${subtitleData.length} segments` : 'none',
    bucketName,
    audioSource,
  });
  
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;
  
  // State for subtitles
  const [subtitles, setSubtitles] = React.useState<SubtitleSegment[]>([]);
  const [loadingStatus, setLoadingStatus] = React.useState<string>('');
  const [handle] = React.useState(() => (subtitlesFile || subtitleData) ? delayRender() : null);

  // Determine sources
  const videoSrc = isLocalFile 
    ? staticFile(`videos/${videoSource}`) 
    : videoSource;

  const audioSrc = audioSource
    ? (isAudioLocal ? staticFile(`audio/${audioSource}`) : audioSource)
    : null;

  // Load subtitles
  React.useEffect(() => {
    async function loadSubtitles() {
      // If subtitle data is provided directly, use it
      if (subtitleData && subtitleData.length > 0) {
        setSubtitles(subtitleData);
        setLoadingStatus(`Using ${subtitleData.length} subtitle segments from props`);
        console.log(`Using ${subtitleData.length} subtitle segments passed directly in props`);
        if (handle) continueRender(handle);
        return;
      }
      
      // Otherwise try to load from file
      if (!subtitlesFile || subtitlesFile.trim() === '') {
        if (handle) continueRender(handle);
        return;
      }

      try {
        setLoadingStatus('Loading subtitles from file...');
        
        // Load from S3 or embedded data
        const loadedSubtitles = await loadSubtitlesFromS3(subtitlesFile, bucketName);
        setSubtitles(loadedSubtitles);
        setLoadingStatus(`Loaded ${loadedSubtitles.length} subtitles from file`);
        console.log(`Successfully loaded ${loadedSubtitles.length} subtitles from file`);
        if (handle) continueRender(handle);
        
      } catch (error) {
        console.error('Failed to load subtitles:', error);
        setLoadingStatus('Failed to load subtitles');
        if (handle) continueRender(handle);
      }
    }
    
    loadSubtitles();
  }, [subtitlesFile, subtitleData, bucketName, handle]);

  // Get current subtitle
  const currentSubtitle = getSubtitleAtTime(subtitles, currentTime - (audioDelay / fps));

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
          muted
          volume={audioSource ? 0 : 1}
        />
      </AbsoluteFill>

      {/* Audio layer */}
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

      {/* Subtitle layer */}
      {subtitles.length > 0 && (
        <Sequence from={audioDelay}>
          <SubtitleDisplay subtitle={currentSubtitle} style={subtitleStyle} />
        </Sequence>
      )}

      {/* Debug info */}
      {showDebugInfo && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            padding: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '15px',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'monospace',
              lineHeight: 1.6,
              maxWidth: 400,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>
              🎬 Debug Info
            </div>
            <div>Frame: {frame} / {durationInFrames}</div>
            <div>Time: {currentTime.toFixed(2)}s</div>
            <div>Audio: {audioSource || 'None'}</div>
            <div>Audio Delay: {audioDelay} frames</div>
            <div style={{ marginTop: 10 }}>
              <strong>Subtitles:</strong>
              <div>File: {subtitlesFile || 'None'}</div>
              <div>Status: {loadingStatus}</div>
              <div>Count: {subtitles.length}</div>
              <div>Current: {currentSubtitle ? currentSubtitle.text.substring(0, 50) + '...' : 'None'}</div>
            </div>
            <div>Adjusted Time: {(currentTime - audioDelay / fps).toFixed(2)}s</div>
            
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #555' }}>
              <div>📹 Video: {videoSource}</div>
              {audioSource && <div>🎵 Audio: {audioSource}</div>}
              <div>🔊 Volume: {audioVolume}</div>
              {audioDelay > 0 && <div>⏱️ Audio Delay: {audioDelay} frames</div>}
            </div>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #555' }}>
              <div>📝 Subtitles: {loadingStatus}</div>
              {subtitlesFile && <div>📄 File: {subtitlesFile}</div>}
              {bucketName && <div>🪣 Bucket: {bucketName}</div>}
              <div>🎨 Style: {subtitleStyle}</div>
              
              {currentSubtitle ? (
                <div style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: 5 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Current Subtitle:</div>
                  <div>"{currentSubtitle.text}"</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                    {currentSubtitle.start}s - {currentSubtitle.end}s
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, color: '#666' }}>
                  No subtitle at current time
                </div>
              )}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
