import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraSettings, TelemetryData, WebRTCStatsData, ConnectionState } from '../types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const DEFAULT_SETTINGS: CameraSettings = {
  resolution: '1280x720',
  fps: 30,
  bitrate: 3500,
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  awbMode: 'auto',
  hflip: false,
  vflip: false,
  nightMode: false,
  autofocus: true,
};

export function useWebRTCStream(streamId: string = 'picam-default') {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isProducerOnline, setIsProducerOnline] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    cpuTemp: 43.8,
    fps: 30,
    bitrate: 3500,
    resolution: '1280x720',
    model: 'Raspberry Pi Camera Module 3',
    sensor: 'Sony IMX708 with PDAF',
    uptime: 120,
    throttled: '0x0 (Nominal)',
    viewers: 1,
  });
  const [stats, setStats] = useState<WebRTCStatsData>({
    rttMs: 14,
    fps: 30,
    bitrateKbps: 3450,
    packetsLost: 0,
    packetLossPercent: 0,
    jitterMs: 2,
    codec: 'H.264 High Profile',
    resolution: '1280x720',
    iceConnectionState: 'new',
    connectionState: 'new',
  });
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_SETTINGS);
  const [isVirtualProducerRunning, setIsVirtualProducerRunning] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const statsIntervalRef = useRef<number | null>(null);
  const prevBytesRef = useRef<{ bytes: number; timestamp: number } | null>(null);
  const prevFramesRef = useRef<{ frames: number; timestamp: number } | null>(null);

  // Virtual producer references
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const virtualAnimRef = useRef<number | null>(null);
  const virtualPcRef = useRef<RTCPeerConnection | null>(null);

  // Send control command
  const sendControl = useCallback(
    (command: Partial<CameraSettings>) => {
      setSettings((prev) => ({ ...prev, ...command }));

      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'camera-control',
            streamId,
            payload: command,
          })
        );
      }

      // Also send via WebRTC DataChannel if open
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({ type: 'control', command }));
      }
    },
    [streamId]
  );

  // Start WebRTC Negotiation with producer
  const startWebRTCNegotiation = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    setConnectionState('connecting');

    // Create Data Channel for low latency bi-directional camera commands & telemetry
    try {
      const dc = pc.createDataChannel('picam-control', { ordered: true });
      dataChannelRef.current = dc;
      dc.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'telemetry') {
            setTelemetry((prev) => ({ ...prev, ...data.payload }));
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // Data channel not supported in this mode
    }

    // Add receive-only video transceiver
    pc.addTransceiver('video', { direction: 'recvonly' });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setConnectionState('connected');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'signal',
            streamId,
            signal: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          })
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      setStats((s) => ({ ...s, iceConnectionState: pc.iceConnectionState }));
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionState('failed');
      }
    };

    pc.onconnectionstatechange = () => {
      setStats((s) => ({ ...s, connectionState: pc.connectionState }));
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setConnectionState('reconnecting');
      }
    };

    try {
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });
      await pc.setLocalDescription(offer);

      wsRef.current.send(
        JSON.stringify({
          type: 'signal',
          streamId,
          signal: {
            type: 'offer',
            sdp: offer.sdp,
          },
        })
      );
    } catch (err) {
      console.error('Failed to create WebRTC offer:', err);
      setConnectionState('failed');
    }
  }, [streamId]);

  // Connect WebSocket Signaling
  useEffect(() => {
    let reconnectTimeout: number;
    let isMounted = true;

    function connectSignaling() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionState('connecting');
        // Register as viewer
        ws.send(
          JSON.stringify({
            type: 'register',
            role: 'viewer',
            streamId,
          })
        );
      };

      ws.onmessage = async (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'registered') {
            setIsProducerOnline(msg.producerOnline);
            if (msg.metadata) {
              setTelemetry((prev) => ({ ...prev, ...msg.metadata }));
            }
            if (msg.producerOnline) {
              startWebRTCNegotiation();
            }
          } else if (msg.type === 'producer-status') {
            setIsProducerOnline(msg.online);
            if (msg.metadata) {
              setTelemetry((prev) => ({ ...prev, ...msg.metadata }));
            }
            if (msg.online) {
              startWebRTCNegotiation();
            } else {
              setRemoteStream(null);
              setConnectionState('disconnected');
            }
          } else if (msg.type === 'signal') {
            const { signal } = msg;
            const pc = pcRef.current;
            if (!pc) return;

            if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
              await pc.addIceCandidate(
                new RTCIceCandidate({
                  candidate: signal.candidate,
                  sdpMid: signal.sdpMid,
                  sdpMLineIndex: signal.sdpMLineIndex,
                })
              );
            }
          } else if (msg.type === 'telemetry') {
            setTelemetry((prev) => ({ ...prev, ...msg.telemetry }));
          }
        } catch (err) {
          console.error('Error handling signaling message:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionState('disconnected');
        reconnectTimeout = window.setTimeout(connectSignaling, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectSignaling();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [streamId, startWebRTCNegotiation]);

  // Periodic RTCPeerConnection Stats Polling
  useEffect(() => {
    statsIntervalRef.current = window.setInterval(async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState !== 'connected') return;

      try {
        const statsReport = await pc.getStats();
        let rtt = stats.rttMs;
        let fps = stats.fps;
        let bitrate = stats.bitrateKbps;
        let lost = stats.packetsLost;
        let jitter = stats.jitterMs;
        let codec = stats.codec;
        let res = stats.resolution;

        statsReport.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime !== undefined) {
              rtt = Math.round(report.currentRoundTripTime * 1000);
            }
          }

          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const now = report.timestamp;
            if (prevBytesRef.current) {
              const bytesDiff = report.bytesReceived - prevBytesRef.current.bytes;
              const timeDiff = (now - prevBytesRef.current.timestamp) / 1000;
              if (timeDiff > 0 && bytesDiff >= 0) {
                bitrate = Math.round((bytesDiff * 8) / timeDiff / 1000);
              }
            }
            prevBytesRef.current = { bytes: report.bytesReceived, timestamp: now };

            if (report.framesDecoded !== undefined) {
              if (prevFramesRef.current) {
                const framesDiff = report.framesDecoded - prevFramesRef.current.frames;
                const timeDiff = (now - prevFramesRef.current.timestamp) / 1000;
                if (timeDiff > 0 && framesDiff >= 0) {
                  fps = Math.round(framesDiff / timeDiff);
                }
              }
              prevFramesRef.current = { frames: report.framesDecoded, timestamp: now };
            }

            if (report.packetsLost !== undefined) {
              lost = report.packetsLost;
            }
            if (report.jitter !== undefined) {
              jitter = Math.round(report.jitter * 1000);
            }
            if (report.frameWidth && report.frameHeight) {
              res = `${report.frameWidth}x${report.frameHeight}`;
            }
          }

          if (report.type === 'codec' && report.mimeType) {
            codec = report.mimeType.replace('video/', '').toUpperCase();
          }
        });

        setStats((prev) => ({
          ...prev,
          rttMs: rtt,
          fps: fps || prev.fps,
          bitrateKbps: bitrate || prev.bitrateKbps,
          packetsLost: lost,
          jitterMs: jitter,
          codec,
          resolution: res,
          iceConnectionState: pc.iceConnectionState,
          connectionState: pc.connectionState,
        }));
      } catch {
        // stats unavailable
      }
    }, 1000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [stats]);

  // Start / Stop Interactive Virtual PiCam Broadcaster (Simulated Test Stream)
  const toggleVirtualProducer = useCallback(
    async (source: 'test-card' | 'user-media' = 'test-card') => {
      if (isVirtualProducerRunning) {
        // Stop
        if (virtualAnimRef.current) {
          cancelAnimationFrame(virtualAnimRef.current);
          virtualAnimRef.current = null;
        }
        if (virtualPcRef.current) {
          virtualPcRef.current.close();
          virtualPcRef.current = null;
        }
        setIsVirtualProducerRunning(false);
        return;
      }

      try {
        let stream: MediaStream;

        if (source === 'user-media') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: false,
          });
        } else {
          // Synthetic PiCam test card with radar sweep, moving timecode and telemetry overlay
          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          virtualCanvasRef.current = canvas;
          const ctx = canvas.getContext('2d')!;

          let frameCount = 0;
          const drawFrame = () => {
            frameCount++;
            const now = new Date();
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            const timeStr = `${now.toTimeString().split(' ')[0]}.${ms}`;

            // Dark industrial background
            ctx.fillStyle = '#090a0f';
            ctx.fillRect(0, 0, 1280, 720);

            // Subtle grid
            ctx.strokeStyle = '#1a2233';
            ctx.lineWidth = 1;
            for (let x = 0; x < 1280; x += 40) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, 720);
              ctx.stroke();
            }
            for (let y = 0; y < 720; y += 40) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(1280, y);
              ctx.stroke();
            }

            // Radar Circle & Sweep
            const cx = 640;
            const cy = 360;
            const radius = 220;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, radius / 2, 0, Math.PI * 2);
            ctx.stroke();

            // Sweeper line
            const angle = (frameCount * 0.05) % (Math.PI * 2);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            ctx.stroke();

            // Center crosshair
            ctx.strokeStyle = '#34d399';
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy);
            ctx.lineTo(cx + 20, cy);
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx, cy + 20);
            ctx.stroke();

            // Real-time Visual Timecode for glass-to-glass latency test
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 38px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(timeStr, cx, cy - 60);

            ctx.fillStyle = '#10b981';
            ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('RASPBERRY PI CAM · LIVE WEBRTC FEED', cx, cy + 80);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px "JetBrains Mono", monospace';
            ctx.fillText(`FRAME #${frameCount} · 1280x720 @ 30 FPS · H.264`, cx, cy + 110);

            // Watermark corners
            ctx.textAlign = 'left';
            ctx.fillStyle = '#64748b';
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillText('DEVICE: RPI-CAM-IMX708-01', 30, 40);
            ctx.fillText('DRIVER: LIBCAMERA-V4L2', 30, 60);
            ctx.fillText('TRANSPORT: WEBRTC / SRTP', 30, 80);

            ctx.textAlign = 'right';
            ctx.fillText('LATENCY PROTOCOL: ZERO-BUFFER', 1250, 40);
            ctx.fillText('CLOCK SYNC: LOCAL PRECISION NTP', 1250, 60);

            virtualAnimRef.current = requestAnimationFrame(drawFrame);
          };

          drawFrame();
          stream = canvas.captureStream(30);
        }

        // Connect directly to local player or as producer
        setRemoteStream(stream);
        setIsVirtualProducerRunning(true);
        setIsProducerOnline(true);
        setConnectionState('connected');

        setTelemetry((prev) => ({
          ...prev,
          model: 'Virtual PiCam Simulator (Test Pattern)',
          sensor: 'Virtual 1080p Engine',
          resolution: '1280x720',
          fps: 30,
          cpuTemp: 41.5,
          uptime: 0,
        }));
      } catch (err) {
        console.error('Failed to initialize virtual camera stream:', err);
      }
    },
    [isVirtualProducerRunning]
  );

  return {
    connectionState,
    isProducerOnline,
    remoteStream,
    telemetry,
    stats,
    settings,
    sendControl,
    startWebRTCNegotiation,
    isVirtualProducerRunning,
    toggleVirtualProducer,
  };
}
