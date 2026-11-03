// src/components/DocEditor.js
import React, { useEffect, useState } from 'react';
import Mammoth from 'mammoth';

const DocEditor = () => {
  const [docContent, setDocContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the document when the component mounts
  useEffect(() => {
    fetch('/SOP template.docx')  // Fetch from public folder
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target.result;
          const result = await Mammoth.convertToHtml({ arrayBuffer });
          setDocContent(result.value);
          setIsLoaded(true);  // Set loaded status to true
        };
        reader.readAsArrayBuffer(blob);
      });
  }, []);

  const handlePrint = () => {
    window.print();  // Triggers browser's print functionality
  };

  if (!isLoaded) {
    return <div>Loading document...</div>;  // Show loading indicator
  }

  return (
    <div>
      <h2>Edit Document</h2>
      <div
        contentEditable="true"  // Allows the content to be editable
        style={{ border: '1px solid black', padding: '10px', minHeight: '500px' }}
        dangerouslySetInnerHTML={{ __html: docContent }}  // Insert the doc content
      />
      <button onClick={handlePrint} style={{ marginTop: '20px' }}>Print Document</button>
    </div>
  );
};

export default DocEditor;