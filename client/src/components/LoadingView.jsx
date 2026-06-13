import React, { useEffect, useState } from 'react';

export default function LoadingView({ taskId, onFinished, onCancel }) {
  const [status, setStatus] = useState('pending');
  const [queuePosition, setQueuePosition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/collage/status/${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to get task status');
        }
        
        const data = await response.json();
        
        if (!isMounted) return;

        if (data.status === 'completed') {
          clearInterval(intervalId);
          onFinished(data.resultUrl);
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          setError(data.error || 'Failed to process images. Please try again.');
        } else {
          setStatus(data.status); // 'pending' or 'processing'
          setQueuePosition(data.queuePosition);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Polling error:', err);
        // We don't immediately fail here to handle intermittent network drops
      }
    };

    // Poll immediately, then every 1 second
    checkStatus();
    intervalId = setInterval(checkStatus, 1000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, onFinished]);

  return (
    <div className="loading-view card glass">
      <div className="loader-container">
        {error ? (
          <div className="loading-error-state">
            <div className="error-icon">✕</div>
            <h3>Stitching Failed</h3>
            <p className="error-text">{error}</p>
            <button type="button" className="action-btn back-btn" onClick={onCancel}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="loading-active-state">
            <div className="spinner-wrapper">
              <div className="premium-spinner"></div>
              <div className="spinner-glow"></div>
            </div>

            <h3 className="loading-heading">
              {status === 'pending' 
                ? (queuePosition !== null && queuePosition > 0 
                  ? `Queued (Position #${queuePosition})` 
                  : 'Queued in Queue')
                : 'Generating Collage...'}
            </h3>
            
            <p className="loading-subtext">
              {status === 'pending' 
                ? (queuePosition !== null && queuePosition > 0
                  ? `There are ${queuePosition - 1} job(s) ahead of you. Image processing will begin momentarily.`
                  : 'Your job is next in line. Image processing will begin momentarily.')
                : 'Resizing photos, aligning orientations, and blending borders...'}
            </p>

            <div className="progress-bar-container">
              <div className={`progress-bar-fill ${status}`}></div>
            </div>

            <div className="step-indicators">
              <div className="step-item completed">
                <span className="step-dot">✓</span>
                <span className="step-label">Upload</span>
              </div>
              <div className={`step-item ${status === 'processing' ? 'active' : ''}`}>
                <span className="step-dot">2</span>
                <span className="step-label">Process</span>
              </div>
              <div className="step-item">
                <span className="step-dot">3</span>
                <span className="step-label">Download</span>
              </div>
            </div>

            <button type="button" className="cancel-link" onClick={onCancel}>
              Cancel Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
