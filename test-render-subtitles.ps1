# Test Instagram Reel render with automatic subtitle generation

Write-Host "🎬 Testing Instagram Reel render with automatic subtitles" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if server is running
Write-Host "Checking if dev server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -ErrorAction Stop
    Write-Host "✅ Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev server is not running!" -ForegroundColor Red
    Write-Host "Please start it with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📤 Sending render request..." -ForegroundColor Yellow
Write-Host ""

# Prepare the request body
$body = @{
    id = "InstagramReel"
    inputProps = @{
        videoSource = "test-video.mp4"
        isLocalFile = $true
        audioSource = "test-audio.mp3"
        isAudioLocal = $true
        audioVolume = 0.8
        subtitlesFile = ""
        subtitleStyle = "instagram"
        showDebugInfo = $false
    }
} | ConvertTo-Json -Depth 10

# Send the request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/lambda/render" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Render request sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host

    if ($response.renderId) {
        Write-Host ""
        Write-Host "🔍 Track progress at: http://localhost:3000/progress/$($response.renderId)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 What's happening:" -ForegroundColor Cyan
        Write-Host "1. ✅ Render request received" -ForegroundColor White
        Write-Host "2. ✅ Whisper Lambda is generating subtitles from audio" -ForegroundColor White
        Write-Host "3. ✅ Subtitles will be saved to S3" -ForegroundColor White
        Write-Host "4. ✅ Remotion Lambda will render video with subtitles" -ForegroundColor White
        Write-Host "5. ⏳ Video is being processed..." -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to send render request" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure dev server is running: npm run dev" -ForegroundColor White
    Write-Host "2. Check that test files exist:" -ForegroundColor White
    Write-Host "   - public/audio/test-audio.mp3" -ForegroundColor White
    Write-Host "   - public/videos/test-video.mp4" -ForegroundColor White
    Write-Host "3. Verify AWS credentials in .env" -ForegroundColor White
}
