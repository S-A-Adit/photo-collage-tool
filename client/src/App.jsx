import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import LoadingView from './components/LoadingView';
import DownloadView from './components/DownloadView';
import './App.css';

export default function App() {
  const [step, setStep] = useState('upload'); // 'upload' | 'loading' | 'download'
  const [taskId, setTaskId] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState('');

  const handleFormSubmit = async (formData) => {
    setError('');
    setStep('loading');

    try {
      const response = await fetch('/api/collage/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred during upload.');
      }

      const data = await response.json();
      setTaskId(data.taskId);
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err.message);
      // Wait a brief moment before reverting to let the user see the fail message
      setStep('upload');
    }
  };

  const handleFinished = (url) => {
    setResultUrl(url);
    setStep('download');
  };

  const handleCancel = () => {
    setTaskId(null);
    setResultUrl(null);
    setStep('upload');
  };

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">❖</span>
          <h1 className="logo-title">StitchFlow</h1>
          <span className="badge">v1.0</span>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner floating">{error}</div>}

        <div className="view-transition-container">
          {step === 'upload' && (
            <UploadForm onSubmit={handleFormSubmit} />
          )}

          {step === 'loading' && (
            <LoadingView 
              taskId={taskId} 
              onFinished={handleFinished} 
              onCancel={handleCancel} 
            />
          )}

          {step === 'download' && (
            <DownloadView 
              resultUrl={resultUrl} 
              onReset={handleCancel} 
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 StitchFlow. High-fidelity image combinations instantly. All files deleted after 30 minutes.</p>
      </footer>
    </div>
  );
}
