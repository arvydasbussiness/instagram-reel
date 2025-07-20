import React from 'react';
import { AbsoluteFill } from 'remotion';

export const VideoInstructions: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: 50,
        fontFamily: 'Arial, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, marginBottom: 30 }}>Instagram Reel Setup</h1>
        
        <div style={{ fontSize: 20, lineHeight: 1.6 }}>
          <h2 style={{ fontSize: 32, marginTop: 40, marginBottom: 20 }}>
            📹 How to add your video:
          </h2>
          
          <ol style={{ paddingLeft: 30 }}>
            <li style={{ marginBottom: 15 }}>
              Copy your video file to: <br />
              <code style={{ 
                backgroundColor: '#333', 
                padding: '5px 10px', 
                borderRadius: 5,
                fontSize: 18 
              }}>
                C:\Git\remotion\instagram-reel\public\videos\
              </code>
            </li>
            
            <li style={{ marginBottom: 15 }}>
              Update the filename in constants.ts
            </li>
          </ol>

          <h2 style={{ fontSize: 32, marginTop: 40, marginBottom: 20 }}>
            🎵 How to add audio:
          </h2>
          
          <ol style={{ paddingLeft: 30 }}>
            <li style={{ marginBottom: 15 }}>
              Copy your audio file to: <br />
              <code style={{ 
                backgroundColor: '#333', 
                padding: '5px 10px', 
                borderRadius: 5,
                fontSize: 18 
              }}>
                C:\Git\remotion\instagram-reel\public\audio\
              </code>
            </li>
            
            <li style={{ marginBottom: 15 }}>
              Update audio settings in constants.ts:
              <pre style={{ 
                backgroundColor: '#333', 
                padding: 10, 
                borderRadius: 5,
                fontSize: 16,
                marginTop: 10 
              }}>
{`audioSource: "background-music.mp3",
audioVolume: 0.8,
audioDelay: 0,`}
              </pre>
            </li>
          </ol>
          
          <h3 style={{ fontSize: 24, marginTop: 40, marginBottom: 15 }}>
            Supported formats:
          </h3>
          <div style={{ display: 'flex', gap: 40 }}>
            <div>
              <strong>Video:</strong>
              <ul style={{ paddingLeft: 20, marginTop: 5 }}>
                <li>MP4 (recommended)</li>
                <li>WebM</li>
                <li>MOV</li>
              </ul>
            </div>
            <div>
              <strong>Audio:</strong>
              <ul style={{ paddingLeft: 20, marginTop: 5 }}>
                <li>MP3 (recommended)</li>
                <li>WAV</li>
                <li>M4A</li>
              </ul>
            </div>
          </div>

          <h3 style={{ fontSize: 24, marginTop: 30, marginBottom: 15 }}>
            Run the project:
          </h3>
          <code style={{ 
            backgroundColor: '#333', 
            padding: '10px 15px', 
            borderRadius: 5,
            fontSize: 18,
            display: 'block'
          }}>
            npm start
          </code>
          <p style={{ marginTop: 10, fontSize: 16 }}>
            Then select "InstagramReel" from the composition dropdown
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
