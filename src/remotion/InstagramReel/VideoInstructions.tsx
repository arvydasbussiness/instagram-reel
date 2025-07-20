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
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, marginBottom: 30 }}>Instagram Reel Setup</h1>
        
        <div style={{ fontSize: 20, lineHeight: 1.6 }}>
          <h2 style={{ fontSize: 32, marginTop: 40, marginBottom: 20 }}>
            How to add your video:
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
              Update the filename in: <br />
              <code style={{ 
                backgroundColor: '#333', 
                padding: '5px 10px', 
                borderRadius: 5,
                fontSize: 18 
              }}>
                src\remotion\InstagramReel\constants.ts
              </code>
            </li>
            
            <li style={{ marginBottom: 15 }}>
              Run: <code style={{ 
                backgroundColor: '#333', 
                padding: '5px 10px', 
                borderRadius: 5,
                fontSize: 18 
              }}>npm start</code> and select "InstagramReel"
            </li>
          </ol>
          
          <h3 style={{ fontSize: 24, marginTop: 40, marginBottom: 15 }}>
            Supported formats:
          </h3>
          <ul style={{ paddingLeft: 30 }}>
            <li>MP4 (recommended)</li>
            <li>WebM</li>
            <li>MOV</li>
          </ul>
        </div>
      </div>
    </AbsoluteFill>
  );
};
