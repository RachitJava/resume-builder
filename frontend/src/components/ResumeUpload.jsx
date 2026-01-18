import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import uploadApi from '../api/uploadApi';

export default function ResumeUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(extension)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    // Check file size (1 MB limit)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size (${fileSizeMB} MB) exceeds the 1 MB limit. Please upload a smaller file or compress your resume.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const parsedResume = await uploadApi.parseResume(file);

      // Basic validation to check if it's actually a resume
      if (!parsedResume || (!parsedResume.fullName && !parsedResume.email && !parsedResume.phone)) {
        setError('⚠️ This file doesn\'t appear to be a resume/CV. Please upload a valid resume with your contact information.');
        setUploading(false);
        return;
      }

      navigate('/editor', { state: { parsedResume, fromUpload: true } });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to parse resume. Please try again.';
      setError(errorMsg.includes('resume') || errorMsg.includes('CV')
        ? errorMsg
        : '⚠️ Unable to parse this file. Please ensure it\'s a valid resume/CV document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all ${isDragging
        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-white/10'
        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto border-3 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          {/* Fixed text visibility for light/dark modes */}
          <p className="text-gray-700 dark:text-gray-300 font-medium">Analyzing your resume...</p>
        </div>
      ) : (
        <>
          {/* Icon with white/contrast color */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-900 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Upload Your Resume</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Drag & drop your PDF or DOCX file here, or click to browse
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              PDF
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              DOCX
            </span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span>Max 1 MB</span>
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
