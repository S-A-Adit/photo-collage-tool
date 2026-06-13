import React from 'react';

export default function DownloadView({ resultUrl, onReset }) {
  return (
    <div className="download-view card glass">
      <div className="download-header">
        <div className="success-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
        <h2>Your Collage is Ready!</h2>
        <p>Preview your stitched masterpiece below and download it to your device.</p>
      </div>

      <div className="collage-preview-container">
        <img src={resultUrl} alt="Your Generated Collage" className="collage-preview-image" />
      </div>

      <div className="download-actions">
        <a href={`${resultUrl}?download=true`} download target="_blank" rel="noopener noreferrer" className="action-btn download-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 inline-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Image
        </a>
        
        <button type="button" onClick={onReset} className="action-btn secondary-btn">
          Create Another Collage
        </button>
      </div>
    </div>
  );
}
