import React, { useState } from 'react';
import { renderApi } from '../lib/api/renderApi';
import { SubtitleSegment } from '../remotion/InstagramReel/components/Subtitles';
import { defaultMyCompProps } from '../types/constants';

export const RenderWithSubtitles: React.FC = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [enableAutoTranscribe, setEnableAutoTranscribe] = useState(true);
  const [customSubtitles, setCustomSubtitles] = useState<SubtitleSegment[]>([]);

  const handleRender = async () => {
    setIsRendering(true);
    setError(null);
    
    try {
      const result = await renderApi.renderWithSubtitles({
        id: 'InstagramReel',
        inputProps: {
          ...defaultMyCompProps,
          videoSource: videoUrl || defaultMyCompProps.videoSource,
          isLocalFile: false, // Using URL
          autoTranscribe: enableAutoTranscribe,
          subtitles: customSubtitles.length > 0 ? customSubtitles : undefined,
          enableSubtitles: true,
          transcriptApiUrl: 'http://13.48.58.235',
        },
      });
      setRenderResult(result);
      console.log('Render started:', result);
      
      // Poll for progress
      pollProgress(result.bucketName, result.renderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed');
    } finally {
      setIsRendering(false);
    }
  };

  const pollProgress = async (bucketName: string, renderId: string) => {
    const interval = setInterval(async () => {
      try {
        const progress = await renderApi.checkProgress(bucketName, renderId);
        
        if (progress.type === 'done') {
          clearInterval(interval);
          console.log('Render complete:', progress.url);
          // Handle completion
        } else if (progress.type === 'error') {
          clearInterval(interval);
          setError(progress.message);
        }
      } catch (err) {
        clearInterval(interval);
        console.error('Progress check failed:', err);
      }
    }, 2000); // Check every 2 seconds
  };
  const handlePreTranscribe = async () => {
    if (!videoUrl) {
      setError('Please enter a video URL');
      return;
    }

    try {
      const subtitles = await renderApi.preTranscribe(videoUrl);
      setCustomSubtitles(subtitles);
      setEnableAutoTranscribe(false);
      console.log('Pre-transcription complete:', subtitles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Render Instagram Reel with Subtitles</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Video URL:
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={enableAutoTranscribe}
            onChange={(e) => setEnableAutoTranscribe(e.target.checked)}
          />
          Enable Auto-Transcribe
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handlePreTranscribe}
          disabled={!videoUrl || isRendering}
          style={{ padding: '10px 20px', marginRight: '10px' }}
        >
          Pre-Transcribe Video
        </button>
        
        <button 
          onClick={handleRender}
          disabled={isRendering || !videoUrl}
          style={{ padding: '10px 20px' }}
        >
          {isRendering ? 'Rendering...' : 'Render with Subtitles'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}
      {customSubtitles.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Pre-Transcribed Subtitles ({customSubtitles.length} segments)</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {customSubtitles.map((sub, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <strong>{sub.start}s - {sub.end}s:</strong> {sub.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {renderResult && (
        <div style={{ marginTop: '20px' }}>
          <h3>Render Result</h3>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(renderResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};