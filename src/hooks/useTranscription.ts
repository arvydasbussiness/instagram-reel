import { useState, useCallback } from 'react';
import { SubtitleSegment } from '../remotion/InstagramReel/components/Subtitles';
import { transcriptService } from '../services/transcriptService';

interface UseTranscriptionOptions {
  apiUrl?: string;
}

interface UseTranscriptionResult {
  subtitles: SubtitleSegment[];
  isLoading: boolean;
  error: string | null;
  transcribeFile: (file: File) => Promise<void>;
  transcribeUrl: (url: string) => Promise<void>;
  clearSubtitles: () => void;
}

export function useTranscription(options?: UseTranscriptionOptions): UseTranscriptionResult {
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = options?.apiUrl 
    ? new transcriptService.constructor(options.apiUrl) 
    : transcriptService;

  const transcribeFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const segments = await service.transcribeFile(file);
      setSubtitles(segments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const transcribeUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const segments = await service.transcribeFromUrl(url);
      setSubtitles(segments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const clearSubtitles = useCallback(() => {
    setSubtitles([]);
    setError(null);
  }, []);

  return {
    subtitles,
    isLoading,
    error,
    transcribeFile,
    transcribeUrl,
    clearSubtitles,
  };
}