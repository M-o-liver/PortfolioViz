import React, { useState } from 'react';

const FileUpload = ({ onDataProcessed }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ProcessTransactions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process transactions');
      }

      const data = await response.json();
      onDataProcessed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Transaction History</h2>
      <p>Upload your Questrade transaction history CSV file to visualize your portfolio growth.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="file-input">
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Visualize Portfolio'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default FileUpload;
