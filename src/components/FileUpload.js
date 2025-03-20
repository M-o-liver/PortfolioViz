import React, { useState } from 'react';

const FileUpload = ({ onDataProcessed, onProcessingStart }) => {
  const [file, setFile] = useState(null);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    onProcessingStart();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ProcessTransactions", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      onDataProcessed(data.history, data.stats);
      
      setFile(null);
      
    } catch (error) {
      alert("Failed to process file. Please try again.");
      console.error(error);
      onDataProcessed(null, null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button type="submit">Visualize Portfolio</button>
    </form>
  );
};

export default FileUpload;
