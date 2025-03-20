import React, { useState } from 'react';

const FileUpload = ({ onDataProcessed, onProcessingError, onProcessingStart }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      onProcessingError("Please select a file to upload.");
      return;
    }

    onProcessingStart();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ProcessTransactions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      onDataProcessed(data.portfolio_history, data.portfolio_summary);
    } catch (error) {
      onProcessingError(error.message || "Failed to process file. Please try again.");
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Transaction History</h2>
      <p>Upload your Questrade transaction history CSV file to visualize your portfolio growth.</p>
      
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button type="submit">Visualize Portfolio</button>
      </form>
    </div>
  );
};

export default FileUpload;
