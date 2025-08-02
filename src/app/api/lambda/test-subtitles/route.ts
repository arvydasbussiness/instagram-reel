import { NextRequest, NextResponse } from 'next/server';
import { transcriptService } from '../../../../../services/transcriptService';
import { SubtitleSegment } from '../../../../../remotion/InstagramReel/components/Subtitles';

/**
 * Test endpoint for subtitle transcription
 * GET /api/lambda/test-subtitles - Test service availability
 * POST /api/lambda/test-subtitles - Test transcription
 */

export async function GET(request: NextRequest) {
  try {
    // Test if transcript service is reachable
    const testUrl = process.env.TRANSCRIPT_API_URL || 'http://13.48.58.235';
    const response = await fetch(`${testUrl}/docs`);
    
    return NextResponse.json({
      status: 'ok',
      transcriptServiceUrl: testUrl,
      serviceReachable: response.ok,
      serviceStatus: response.status,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {    const body = await request.json();
    const { url, file } = body;

    if (!url && !file) {
      return NextResponse.json({
        error: 'Please provide either a URL or file to transcribe',
      }, { status: 400 });
    }

    let subtitles: SubtitleSegment[] = [];
    const apiUrl = process.env.TRANSCRIPT_API_URL || 'http://13.48.58.235';
    const service = new transcriptService.constructor(apiUrl);

    if (url) {
      // Test URL transcription
      subtitles = await service.transcribeFromUrl(url);
    } else if (file) {
      // For file upload testing (base64 encoded)
      const buffer = Buffer.from(file.content, 'base64');
      const blob = new Blob([buffer], { type: file.type });
      const fileObj = new File([blob], file.name, { type: file.type });
      
      subtitles = await service.transcribeFile(fileObj);
    }

    return NextResponse.json({
      status: 'success',
      transcriptApiUrl: apiUrl,
      subtitleCount: subtitles.length,
      subtitles: subtitles,
      // Include first few subtitles as preview
      preview: subtitles.slice(0, 5),
    });
  } catch (error) {
    console.error('Test transcription error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Transcription failed',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}