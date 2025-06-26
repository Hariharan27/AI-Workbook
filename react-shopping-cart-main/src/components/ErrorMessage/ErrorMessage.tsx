import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  showRetry = true
}) => (
  <div style={{
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    margin: '20px',
    color: '#856404'
  }}>
    <h3 style={{ 
      marginBottom: '10px',
      color: '#856404',
      fontSize: '18px'
    }}>
      {title}
    </h3>
    <p style={{ 
      marginBottom: '15px',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      {message}
    </p>
    {showRetry && onRetry && (
      <button 
        onClick={onRetry}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorMessage; 