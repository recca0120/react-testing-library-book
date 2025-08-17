import React, { useState } from 'react';

export const ConditionalContent: React.FC = () => {
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleContent = () => {
    setShowContent(!showContent);
    setError(null);
  };

  const triggerError = () => {
    setError('Something went wrong!');
    setShowContent(false);
  };

  return (
    <div>
      <button onClick={toggleContent}>Toggle Content</button>
      <button onClick={triggerError}>Trigger Error</button>
      
      {showContent && (
        <div className="content">
          <h3>Dynamic Content</h3>
          <p>This content can be toggled on and off.</p>
        </div>
      )}
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
    </div>
  );
};