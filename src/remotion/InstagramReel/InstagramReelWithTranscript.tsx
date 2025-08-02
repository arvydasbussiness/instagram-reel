import React, { useState, useEffect } from 'react';
import { continueRender, delayRender } from 'remotion';
import { InstagramReel, InstagramReelProps } from './InstagramReel';
import { SubtitleSegment } from './components/Subtitles';
import { transcriptService } from '../../services/transcriptService';

export interface InstagramReelWithTranscriptProps extends InstagramReelProps {
  autoTranscribe?: boolean; // Automatically transcribe the video/audio
  transcriptApiUrl?: string; // Custom transcript API URL
}

export const InstagramReelWithTranscript: React.FC<InstagramReelWithTranscriptProps> = ({
  autoTranscribe = true,
  transcriptApiUrl,
  ...props
}) => {
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [handle] = useState(() => autoTranscribe ? delayRender() : null);

  useEffect(() => {
    if (!autoTranscribe || !handle) return;

    const loadSubtitles = async () => {
      try {
        // Determine which source to use for transcription
        const sourceToTranscribe = props.audioSource || props.videoSource;
        const isLocal = props.audioSource ? props.isAudioLocal : props.isLocalFile;
        if (!sourceToTranscribe) {
          continueRender(handle);
          return;
        }

        let segments: SubtitleSegment[] = [];

        if (isLocal) {
          // For local files, we need to fetch them first
          // This is a limitation - local files need to be uploaded manually
          console.warn('Local file transcription requires manual upload. Using empty subtitles.');
          segments = [];
        } else {
          // For URLs, we can use the transcribe-from-url endpoint
          const service = transcriptApiUrl 
            ? new transcriptService.constructor(transcriptApiUrl) 
            : transcriptService;
          
          segments = await service.transcribeFromUrl(sourceToTranscribe);
        }

        setSubtitles(segments);
        continueRender(handle);
      } catch (error) {
        console.error('Failed to load subtitles:', error);
        continueRender(handle);
      }
    };
    loadSubtitles();
  }, [autoTranscribe, handle, props.audioSource, props.videoSource, props.isAudioLocal, props.isLocalFile, transcriptApiUrl]);

  return (
    <InstagramReel 
      {...props} 
      subtitles={subtitles}
      enableSubtitles={true}
    />
  );
};