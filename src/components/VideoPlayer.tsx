import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CircleDot,
  Download,
  Maximize2,
  Minimize2,
  PictureInPicture,
  RefreshCw,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { CameraSettings, TelemetryData, WebRTCStatsData } from '../types';

interface VideoPlayerProps {
  remoteStream: MediaStream | null;
  isProducerOnline: boolean;
  telemetry: TelemetryData;
  stats: WebRTCStatsData;
  settings: CameraSettings;
  onRefresh: () => void;
  onToggleVirtualProducer: () => void;
  isVirtualProducerRunning: boolean;
  onOpenSetup: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  remoteStream,
  isProducerOnline,
  telemetry,
  stats,
  settings,
  onRefresh,
  onToggleVirtualProducer,
  isVirtualProducerRunning,
  onOpenSetup,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOsd, setShowOsd] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);

  // Snapshot flash effect
  const [showSnapshotFlash, setShowSnapshotFlash] = useState(false);

  // Sync MediaStream to <video> element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or interrupted:', err);
      });
    }
  }, [remoteStream]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Handle Picture-in-Picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // High-Resolution Snapshot Capture
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    setShowSnapshotFlash(true);
    setTimeout(() => setShowSnapshotFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply digital orientation if required
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `picam_snapshot_${dateStr}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  // Live Stream Recording via MediaRecorder
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
      setIsRecording(false);
      setRecordSeconds(0);
    } else {
      // Start recording
      if (!remoteStream) return;
      try {
        recordedChunksRef.current = [];
        const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp8,opus' };
        let recorder: MediaRecorder;

        if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          recorder = new MediaRecorder(remoteStream, { mimeType: 'video/webm;codecs=h264' });
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          recorder = new MediaRecorder(remoteStream, { mimeType: 'video/webm' });
        } else {
          recorder = new MediaRecorder(remoteStream);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const now = new Date();
          const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.href = url;
          a.download = `picam_stream_${dateStr}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        const startTime = Date.now();
        recordIntervalRef.current = window.setInterval(() => {
          setRecordSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  }, [isRecording, remoteStream]);

  // Digital Pan & Tilt mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const formatRecTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${s}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-neutral-950 flex flex-col justify-center items-center select-none ${
        isFullscreen ? 'h-screen' : 'aspect-video max-h-[720px] rounded-lg border border-neutral-800 shadow-2xl'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Snapshot Flash Overlay */}
      {showSnapshotFlash && (
        <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Main Video Element or Waiting State */}
      {remoteStream && isProducerOnline ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain transition-transform duration-75 ${
              isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
            }`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px) scaleX(${
                settings.hflip ? -1 : 1
              }) scaleY(${settings.vflip ? -1 : 1})`,
              filter: `brightness(${1 + settings.brightness / 100}) contrast(${
                1 + settings.contrast / 100
              }) saturate(${1 + settings.saturation / 100})`,
            }}
          />

          {/* OSD (On-Screen Display) Overlay */}
          {showOsd && (
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* OSD Top Row */}
              <div className="flex items-center justify-between text-xs font-mono text-neutral-200/90 bg-neutral-950/60 backdrop-blur-md px-3 py-1.5 rounded border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-400">LIVE WEBRTC</span>
                  <span className="text-neutral-500">·</span>
                  <span>{telemetry.model || 'Raspberry Pi Camera'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>RTT: <strong className="text-emerald-400 font-semibold">{stats.rttMs} ms</strong></span>
                  <span className="text-neutral-500">·</span>
                  <span>FPS: <strong className="text-neutral-100">{stats.fps}</strong></span>
                  <span className="text-neutral-500">·</span>
                  <span>Bitrate: <strong className="text-neutral-100">{stats.bitrateKbps} kbps</strong></span>
                  {telemetry.cpuTemp && (
                    <>
                      <span className="text-neutral-500">·</span>
                      <span>Pi SoC: <strong className="text-amber-400">{telemetry.cpuTemp}°C</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* OSD Bottom Row */}
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300/80">
                <div className="bg-neutral-950/60 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-800/80">
                  <span>PROTOKÓŁ: SRTP/UDP (ZERO-LATENCY) · KODER: {stats.codec}</span>
                </div>
                {zoom > 1 && (
                  <div className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                    CYFROWY ZOOM: {zoom.toFixed(1)}x
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Waiting / Offline State */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-neutral-900 to-neutral-950">
          <div className="w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400 mb-4">
            <Camera className="w-8 h-8 text-emerald-400/80 animate-pulse" />
          </div>

          <h2 className="text-lg font-semibold text-neutral-100 mb-2">
            Oczekiwanie na połączenie z Raspberry Pi Cam
          </h2>
          <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
            Serwer WebRTC oczekuje na transmisję z kamery. Uruchom skrypt na swoim Raspberry Pi lub włącz natychmiastowy symulator testowy w przeglądarce.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onToggleVirtualProducer}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Sparkles className="w-4 h-4" />
              Uruchom symulator testowy Pi Cam
            </button>

            <button
              onClick={onOpenSetup}
              className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              Zobacz instrukcję dla Raspberry Pi
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-neutral-900/90 backdrop-blur-md rounded-lg border border-neutral-800 shadow-xl z-30 max-w-[95%] overflow-x-auto">
        {/* Recording Button */}
        <button
          onClick={toggleRecording}
          disabled={!remoteStream}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse'
              : 'hover:bg-neutral-800 text-neutral-200'
          }`}
          title="Nagraj strumień WebRTC w formacie WebM"
        >
          <CircleDot className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-rose-500'}`} />
          <span>{isRecording ? `REC ${formatRecTime(recordSeconds)}` : 'Nagraj'}</span>
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Snapshot Capture */}
        <button
          onClick={takeSnapshot}
          disabled={!remoteStream}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Zrób zdjęcie (PNG z pełną rozdzielczością)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
          disabled={!remoteStream || zoom >= 4}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          title="Przybliż (Cyfrowy Zoom)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
          disabled={!remoteStream || zoom <= 1}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          title="Oddal"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {zoom > 1 && (
          <button
            onClick={resetZoom}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Resetuj powiększenie"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* OSD Overlay Toggle */}
        <button
          onClick={() => setShowOsd((prev) => !prev)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
            showOsd ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:bg-neutral-800'
          }`}
          title="Włącz/wyłącz nakładkę telemetryczną OSD"
        >
          OSD
        </button>

        {/* Picture in Picture */}
        <button
          onClick={togglePip}
          disabled={!remoteStream}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          title="Obraz w obrazie (PiP)"
        >
          <PictureInPicture className="w-4 h-4" />
        </button>

        {/* Reconnect / Refresh */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Odśwież negocjację WebRTC"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
