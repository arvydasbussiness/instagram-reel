# Complete Instagram Reel + Subtitles Workflow Test

Write-Host "🎬 Complete Instagram Reel Subtitle Workflow" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Configuration
$apiUrl = "http://localhost:3000/api/lambda/render"
$bucketName = "whisper-lambda-remotion-101"

# Test payload - no subtitlesFile specified to trigger auto-generation
$payload = @{
    id = "InstagramReel"
    inputProps = @{
        videoSource = "test-video.mp4"
        isLocalFile = $true
        audioSource = "test-audio.mp3"
        isAudioLocal = $true
        audioVolume = 0.8
        showDebugInfo = $true
        bucketName = $bucketName
        subtitleStyle = "instagram"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending render request..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "1. Detect missing subtitlesFile" -ForegroundColor White
Write-Host "2. Call Whisper Lambda to generate subtitles from audio" -ForegroundColor White
Write-Host "3. Save subtitles to S3 bucket: $bucketName" -ForegroundColor White
Write-Host "4. Load subtitles from S3 during rendering" -ForegroundColor White
Write-Host "5. Render video with animated Instagram-style subtitles" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $payload `
        -ErrorAction Stop

    Write-Host "✅ Render started successfully!" -ForegroundColor Green
    Write-Host ""
    
    if ($response.renderId) {
        Write-Host "📊 Render Details:" -ForegroundColor Yellow
        Write-Host "Render ID: $($response.renderId)" -ForegroundColor White
        Write-Host "Bucket: $($response.bucketName)" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🔍 Track progress:" -ForegroundColor Yellow
        Write-Host "http://localhost:3000/progress/$($response.renderId)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "📝 What to look for in the video:" -ForegroundColor Yellow
        Write-Host "- Debug overlay showing subtitle status" -ForegroundColor White
        Write-Host "- Instagram-style animated subtitles at the bottom" -ForegroundColor White
        Write-Host "- Subtitles synced with audio" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
