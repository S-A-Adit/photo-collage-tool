import React, { useState, useRef } from 'react';

const PRESET_COLORS = [
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Dark Slate', value: '#1e293b' },
  { name: 'Warm Beige', value: '#f5f5dc' },
  { name: 'Soft Gray', value: '#cbd5e1' },
  { name: 'Pastel Blue', value: '#bae6fd' },
  { name: 'Coral Rose', value: '#fecdd3' }
];

export default function UploadForm({ onSubmit }) {
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState('horizontal');
  const [borderSize, setBorderSize] = useState(10);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const processFiles = (fileList) => {
    setError('');
    const newImages = [...images];
    
    if (newImages.length + fileList.length > 10) {
      setError('You can upload a maximum of 10 images.');
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Images must be smaller than 10MB.');
        continue;
      }

      newImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
    
    setImages(newImages);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (id) => {
    const target = images.find(img => img.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[newIndex];
    newImages[newIndex] = temp;
    setImages(newImages);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length < 2) {
      setError('Please upload at least 2 images to create a collage.');
      return;
    }

    const formData = new FormData();
    images.forEach((img) => {
      formData.append('images', img.file);
    });
    formData.append('layout', layout);
    formData.append('borderSize', borderSize);
    formData.append('borderColor', borderColor);
    formData.append('format', format);
    formData.append('quality', quality);

    onSubmit(formData);
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Assemble Your Masterpiece</h2>
        <p>Upload 2 to 10 photos, select a layout, and stitch them into a clean, modern collage.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-layout-grid">
        {/* Left Column: Image Upload & Re-ordering */}
        <div className="upload-section card">
          <div 
            className={`drag-drop-zone ${dragActive ? 'active' : ''} ${images.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileSelect} 
              className="hidden-file-input"
            />
            <div className="upload-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3>Drag & Drop your photos here</h3>
            <p>or click to browse from your device (Max 10MB per image)</p>
            {images.length > 0 && (
              <span className="file-counter">{images.length} of 10 photos uploaded</span>
            )}
          </div>

          {images.length > 0 && (
            <div className="thumbnail-list-container">
              <h4>Arrange Order</h4>
              <div className="thumbnail-grid">
                {images.map((img, idx) => (
                  <div key={img.id} className="thumbnail-card">
                    <img src={img.previewUrl} alt={`Upload preview ${idx + 1}`} />
                    <div className="thumbnail-badge">{idx + 1}</div>
                    
                    {/* Control overlay */}
                    <div className="thumbnail-controls">
                      <button 
                        type="button" 
                        className="control-btn move-btn" 
                        disabled={idx === 0}
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, -1); }}
                        title="Move Left/Up"
                      >
                        ←
                      </button>
                      <button 
                        type="button" 
                        className="control-btn delete-btn" 
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        title="Delete"
                      >
                        ✕
                      </button>
                      <button 
                        type="button" 
                        className="control-btn move-btn" 
                        disabled={idx === images.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, 1); }}
                        title="Move Right/Down"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Configurations */}
        <div className="config-section card">
          <div className="config-group">
            <label className="config-label">Layout Orientation</label>
            <div className="orientation-cards">
              <div 
                className={`orientation-card ${layout === 'horizontal' ? 'selected' : ''}`}
                onClick={() => setLayout('horizontal')}
              >
                <div className="orientation-visual horizontal">
                  <div className="block"></div>
                  <div className="block"></div>
                  <div className="block"></div>
                </div>
                <span>Horizontal Collage</span>
              </div>
              <div 
                className={`orientation-card ${layout === 'vertical' ? 'selected' : ''}`}
                onClick={() => setLayout('vertical')}
              >
                <div className="orientation-visual vertical">
                  <div className="block"></div>
                  <div className="block"></div>
                  <div className="block"></div>
                </div>
                <span>Vertical Collage</span>
              </div>
            </div>
          </div>

          <div className="config-group">
            <div className="label-row">
              <label className="config-label" htmlFor="border-slider">Border Thickness</label>
              <span className="value-display">{borderSize}px</span>
            </div>
            <input 
              id="border-slider"
              type="range" 
              min="0" 
              max="50" 
              value={borderSize} 
              onChange={(e) => setBorderSize(parseInt(e.target.value, 10))}
              className="premium-slider"
            />
          </div>

          <div className="config-group">
            <label className="config-label">Border & Background Color</label>
            
            {/* Presets */}
            <div className="color-presets">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`color-preset-btn ${borderColor === color.value ? 'active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setBorderColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>

            <div className="custom-color-picker-row">
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={borderColor} 
                  onChange={(e) => setBorderColor(e.target.value)}
                  id="custom-color-picker"
                />
                <label htmlFor="custom-color-picker" className="color-picker-label">
                  Custom Color
                </label>
              </div>
              <input 
                type="text" 
                value={borderColor.toUpperCase()} 
                onChange={(e) => setBorderColor(e.target.value)}
                className="color-hex-input"
                placeholder="#FFFFFF"
                maxLength="7"
              />
            </div>
          </div>

          <div className="config-group">
            <label className="config-label">Download Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div 
                className={`orientation-card ${format === 'png' ? 'selected' : ''}`}
                onClick={() => setFormat('png')}
                style={{ padding: '0.75rem 0.5rem', minHeight: 'unset', gap: '0' }}
              >
                <span>PNG</span>
              </div>
              <div 
                className={`orientation-card ${format === 'jpeg' ? 'selected' : ''}`}
                onClick={() => setFormat('jpeg')}
                style={{ padding: '0.75rem 0.5rem', minHeight: 'unset', gap: '0' }}
              >
                <span>JPEG</span>
              </div>
              <div 
                className={`orientation-card ${format === 'webp' ? 'selected' : ''}`}
                onClick={() => setFormat('webp')}
                style={{ padding: '0.75rem 0.5rem', minHeight: 'unset', gap: '0' }}
              >
                <span>WebP</span>
              </div>
            </div>
          </div>

          {format !== 'png' && (
            <div className="config-group animate-slide-up" style={{ animation: 'fade-in 0.3s ease' }}>
              <div className="label-row">
                <label className="config-label" htmlFor="quality-slider">Image Quality</label>
                <span className="value-display">{quality}%</span>
              </div>
              <input 
                id="quality-slider"
                type="range" 
                min="10" 
                max="100" 
                value={quality} 
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="premium-slider"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="action-btn make-collage-btn"
            disabled={images.length < 2}
          >
            Create Collage
          </button>
        </div>
      </div>
    </form>
  );
}
