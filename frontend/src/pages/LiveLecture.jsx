import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mic, Square, Trash2, Upload, AlertCircle, CheckCircle, Radio } from 'lucide-react';

const LiveLecture = () => {
  const navigate = useNavigate();
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0); // in seconds
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Recording Timer
  useEffect(() => {
    let interval = null;
    if (recording) {
      interval = setInterval(() => {
        setRecordTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Clean up canvas animations and audio nodes on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error(err));
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError('');
    setSuccess('');
    setAudioUrl('');
    setAudioBlob(null);
    audioChunksRef.current = [];
    setRecordTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Initialize AudioContext for visualizer only
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      
      // Setup Analyser Node for visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start visualizer animation loop
      drawVisualizer();

      // Determine best audio recording mimetype
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start(1000); // chunk every 1s
      setRecording(true);

    } catch (err) {
      console.error(err);
      setError('Could not access microphone. Please check system permissions.');
    }
  };

  const stopRecording = () => {
    if (recording) {
      setRecording(false);
      
      // Stop canvas animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks on the stream to release the mic
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error(err));
      }
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const width = canvas.width;
    const height = canvas.height;
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(11, 0, 51, 0.2)'; // match darkBg
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8;
        
        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#13005A'); // primary
        gradient.addColorStop(0.5, '#1C82AD'); // accent
        gradient.addColorStop(1, '#03C988'); // success
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };
    
    draw();
  };

  const handleDiscard = () => {
    setAudioUrl('');
    setAudioBlob(null);
    setRecordTime(0);
  };

  const handleUploadRecord = async () => {
    setError('');
    setSuccess('');

    if (!audioBlob) {
      return setError('No recording found. Please record first.');
    }
    if (!title || !subject) {
      return setError('Title and subject are required fields.');
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description || 'Recorded Live session');
    
    // Compressed audio file creation
    const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([audioBlob], `live_record_${Date.now()}.${extension}`, {
      type: audioBlob.type
    });
    formData.append('audio', file);

    try {
      await api.post('/lectures', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setSuccess('Live lecture upload successful! The audio is now being transcribed and processed.');
      handleDiscard();
      setTitle('');
      setSubject('');
      setDescription('');

      setTimeout(() => {
        navigate('/teacher/history');
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit recording. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-sans tracking-tight">Record Live Lecture</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Record audio lectures in real time from your browser microphone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Form Panel */}
        <div className="md:col-span-2 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium space-y-6">
          <h3 className="text-lg font-bold">Session Details</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-[#03C988]/10 border border-[#03C988]/20 text-[#03C988] p-4 rounded-2xl text-sm flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lecture Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Memory Management in OS"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                disabled={recording || uploading}
                required
              />
            </div>

            {/* Subject field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                disabled={recording || uploading}
                required
              />
            </div>

            {/* Description field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Syllabus Details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the topics discussed in this live session..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors resize-none"
                disabled={recording || uploading}
              />
            </div>
          </div>

          {/* Submission button */}
          {audioBlob && (
            <button
              onClick={handleUploadRecord}
              disabled={uploading || !title || !subject}
              className="w-full bg-[#03C988] hover:bg-[#03C988]/90 text-white font-semibold rounded-2xl py-3.5 shadow-md flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading Session Audio...' : 'Save & Compile Live Notes'}
            </button>
          )}
        </div>

        {/* Right Recorder Panel */}
        <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-premium flex flex-col items-center justify-between min-h-[300px]">
          <div className="flex items-center space-x-2">
            <Radio className={`w-5 h-5 ${recording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Recording Console</span>
          </div>

          {/* Waveform Visualizer Canvas */}
          <div className="w-full flex justify-center my-6">
            {recording ? (
              <canvas
                ref={canvasRef}
                width={200}
                height={80}
                className="w-full max-w-[200px] h-20 rounded-xl bg-slate-900/40 border border-slate-900"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                <Mic className="w-8 h-8 text-slate-500" />
              </div>
            )}
          </div>

          {/* Timer Display */}
          <div className="text-4xl font-mono font-black tracking-widest text-slate-200 mb-6 select-none">
            {formatTime(recordTime)}
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col space-y-3">
            {!recording && !audioBlob && (
              <button
                onClick={startRecording}
                disabled={uploading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl py-3.5 shadow-md flex items-center justify-center transition-colors"
              >
                <Mic className="w-5 h-5 mr-2" /> Start Class Recording
              </button>
            )}

            {recording && (
              <button
                onClick={stopRecording}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-2xl py-3.5 shadow-md flex items-center justify-center transition-colors"
              >
                <Square className="w-5 h-5 mr-2 text-red-500 fill-red-500" /> Stop Recording
              </button>
            )}

            {audioBlob && (
              <div className="w-full flex space-x-3">
                <audio src={audioUrl} controls className="flex-1 h-12 bg-slate-900 rounded-xl" />
                <button
                  onClick={handleDiscard}
                  disabled={uploading}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-3 rounded-2xl text-red-500 hover:text-red-400 transition-colors"
                  title="Discard Recording"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveLecture;
