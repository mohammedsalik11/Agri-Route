'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string, mimeType: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, onCancel, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<'idle' | 'preview' | 'captured'>('idle');
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setError(null);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPhase('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No camera found on this device. Please upload a photo instead.');
      } else {
        setError('Could not start camera: ' + msg);
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setPhase('idle');
    setCapturedSrc(null);
  }, []);

  const snap = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedSrc(dataUrl);
    setPhase('captured');
    // Stop stream to release camera LED
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const retake = useCallback(() => {
    setCapturedSrc(null);
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const confirm = useCallback(() => {
    if (!capturedSrc) return;
    const base64 = capturedSrc.split(',')[1];
    onCapture(base64, 'image/jpeg');
    setPhase('idle');
    setCapturedSrc(null);
  }, [capturedSrc, onCapture]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  // Idle state — show open camera button
  if (phase === 'idle') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => startCamera()}
          className="w-full py-4 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-field-green/60 hover:bg-paper transition-colors disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-full bg-field-green/10 text-field-green flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-field-green">Open Camera</span>
          <span className="text-[11px] text-ink-muted">Tap to take a photo of your produce</span>
        </button>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>
    );
  }

  // Preview state — live viewfinder
  if (phase === 'preview') {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls overlay */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70">
          <button
            type="button"
            onClick={() => { stopCamera(); onCancel?.(); }}
            className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Shutter */}
          <button
            type="button"
            onClick={snap}
            className="w-16 h-16 rounded-full bg-white border-4 border-field-green shadow-lg hover:scale-105 active:scale-95 transition-transform"
            aria-label="Take photo"
          />

          <button
            type="button"
            onClick={flipCamera}
            className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Flip camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Captured state — review before confirming
  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      {capturedSrc && (
        <img src={capturedSrc} alt="Captured produce" className="w-full h-full object-cover" />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Review controls */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70">
        <button
          type="button"
          onClick={retake}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retake
        </button>
        <button
          type="button"
          onClick={confirm}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-field-green text-white text-sm font-bold hover:bg-field-green/90 shadow transition-colors"
        >
          <Check className="w-4 h-4" />
          Use Photo
        </button>
      </div>
    </div>
  );
}
