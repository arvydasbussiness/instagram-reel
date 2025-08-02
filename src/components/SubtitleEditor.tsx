import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { InstagramReel } from '../remotion/InstagramReel/InstagramReel';
import { SubtitleSegment } from '../remotion/InstagramReel/components/Subtitles';
import { useTranscription } from '../hooks/useTranscription';
import {
  INSTAGRAM_REEL_WIDTH,
  INSTAGRAM_REEL_HEIGHT,
  INSTAGRAM_REEL_FPS,
  INSTAGRAM_REEL_DURATION,
} from '../remotion/InstagramReel/constants';

interface SubtitleEditorProps {
  videoSource: string;
  isLocalFile?: boolean;
  audioSource?: string;
  isAudioLocal?: boolean;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  videoSource,
  isLocalFile = true,
  audioSource,
  isAudioLocal = true,
}) => {
  const [manualSubtitles, setManualSubtitles] = useState<SubtitleSegment[]>([]);
  const [subtitleText, setSubtitleText] = useState('');
  const [startTime, setStartTime] = useState('0');
  const [endTime, setEndTime] = useState('2');  const { subtitles, isLoading, error, transcribeUrl, clearSubtitles } = useTranscription({
    apiUrl: 'http://13.48.58.235'
  });

  const handleAddSubtitle = () => {
    if (!subtitleText.trim()) return;

    const newSubtitle: SubtitleSegment = {
      text: subtitleText,
      start: parseFloat(startTime),
      end: parseFloat(endTime),
    };

    setManualSubtitles([...manualSubtitles, newSubtitle].sort((a, b) => a.start - b.start));
    setSubtitleText('');
    setStartTime(String(parseFloat(endTime)));
    setEndTime(String(parseFloat(endTime) + 2));
  };

  const handleTranscribe = async () => {
    if (!isLocalFile && videoSource) {
      await transcribeUrl(videoSource);
    } else if (!isLocalFile && audioSource) {
      await transcribeUrl(audioSource);
    } else {
      alert('Automatic transcription only works with URLs. For local files, please add subtitles manually.');
    }
  };

  const activeSubtitles = subtitles.length > 0 ? subtitles : manualSubtitles;
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Instagram Reel Subtitle Editor</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <Player
            component={InstagramReel}
            durationInFrames={INSTAGRAM_REEL_DURATION}
            fps={INSTAGRAM_REEL_FPS}
            compositionWidth={INSTAGRAM_REEL_WIDTH}
            compositionHeight={INSTAGRAM_REEL_HEIGHT}
            style={{
              width: '100%',
              maxWidth: '400px',
            }}
            inputProps={{
              videoSource,
              isLocalFile,
              audioSource,
              isAudioLocal,
              subtitles: activeSubtitles,
              enableSubtitles: true,
            }}
            controls
          />
        </div>

        <div style={{ flex: 1 }}>
          <h2>Subtitle Controls</h2>          
          {/* Automatic Transcription */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Automatic Transcription</h3>
            <button 
              onClick={handleTranscribe} 
              disabled={isLoading || isLocalFile}
              style={{ padding: '10px 20px', marginRight: '10px' }}
            >
              {isLoading ? 'Transcribing...' : 'Transcribe from URL'}
            </button>
            <button 
              onClick={clearSubtitles}
              style={{ padding: '10px 20px' }}
            >
              Clear Transcription
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {isLocalFile && <p style={{ color: '#666' }}>Note: Automatic transcription only works with URLs</p>}
          </div>

          {/* Manual Subtitle Input */}
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Manual Subtitle Input</h3>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Subtitle text"
                value={subtitleText}
                onChange={(e) => setSubtitleText(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Start (seconds)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="0.1"
                style={{ flex: 1, padding: '8px' }}
              />
              <input
                type="number"
                placeholder="End (seconds)"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="0.1"
                style={{ flex: 1, padding: '8px' }}
              />
            </div>
            <button 
              onClick={handleAddSubtitle}
              style={{ padding: '10px 20px' }}
            >
              Add Subtitle
            </button>
          </div>

          {/* Subtitle List */}
          <div style={{ marginTop: '20px' }}>
            <h3>Current Subtitles</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>              {activeSubtitles.length === 0 ? (
                <p>No subtitles added yet</p>
              ) : (
                activeSubtitles.map((subtitle, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '10px', 
                      margin: '5px 0', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px' 
                    }}
                  >
                    <strong>{subtitle.start}s - {subtitle.end}s:</strong> {subtitle.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Subtitles */}
      <div style={{ marginTop: '20px' }}>
        <h3>Export Subtitles JSON</h3>
        <textarea
          readOnly
          value={JSON.stringify(activeSubtitles, null, 2)}
          style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
};