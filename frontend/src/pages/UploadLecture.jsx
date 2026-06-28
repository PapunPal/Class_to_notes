import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Upload, FileAudio, AlertCircle, CheckCircle } from 'lucide-react';

const UploadLecture = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      return setError('Only MP3, WAV, M4A, WEBM, or OGG files are supported.');
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      return setError('File size exceeds 100MB limit.');
    }

    setFile(selectedFile);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      return setError('Please select an audio file to upload.');
    }
    if (!title || !subject) {
      return setError('Title and subject are required fields.');
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('audio', file);

    try {
      const response = await api.post('/lectures', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess('Lecture uploaded successfully! Speech-to-text conversion and note generation are now executing in the background.');
      
      // Reset form
      setTitle('');
      setSubject('');
      setDescription('');
      setFile(null);

      // Redirect after a brief delay
      setTimeout(() => {
        navigate('/teacher/history');
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Upload failed. Please check your network connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-sans tracking-tight">Upload Lecture Recording</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload audio recordings of your lectures to generate study resources.
        </p>
      </div>

      <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-[#03C988]/10 border border-[#03C988]/20 text-[#03C988] p-4 rounded-2xl text-sm mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lecture Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Binary Search"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                required
                disabled={uploading}
              />
            </div>

            {/* Subject field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                required
                disabled={uploading}
              />
            </div>

            {/* Description field */}
            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description / Syllabus details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give context or syllabus information about this lecture to help the AI model contextualize the notes..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors resize-none"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audio Recording File</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200
                ${dragActive ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-slate-800 hover:border-accent/40'}
                ${file ? 'bg-slate-50/50 dark:bg-slate-900/10' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="audio/mp3,audio/wav,audio/m4a,audio/webm,audio/ogg"
                className="hidden"
                disabled={uploading}
              />

              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <FileAudio className="w-12 h-12 text-[#03C988]" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{file.name}</span>
                  <span className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span className="text-xs text-accent font-semibold underline">Click to change file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="font-semibold text-sm">Drag and drop your audio file here</p>
                  <p className="text-xs text-slate-400">or click to browse from device (MP3, WAV, M4A, WEBM, OGG)</p>
                  <p className="text-[10px] text-slate-500 font-light mt-1">Maximum file size: 100MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Uploading payload...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-accent h-full transition-all duration-150 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold rounded-2xl py-3.5 shadow-md transition-colors disabled:opacity-50"
          >
            {uploading ? 'Processing File Transfer...' : 'Upload & Generate Notes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadLecture;
