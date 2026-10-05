export interface CameraSettings {
  resolution: '1920x1080' | '1280x720' | '854x480' | '640x360';
  fps: 15 | 30 | 60 | 90;
  bitrate: number; // in kbps
  exposure: number; // -2 to +2
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  awbMode: 'auto' | 'daylight' | 'cloudy' | 'tungsten' | 'fluorescent';
  hflip: boolean;
  vflip: boolean;
  nightMode: boolean;
  autofocus: boolean;
}

export interface TelemetryData {
  cpuTemp?: number;
  throttled?: string;
  fps?: number;
  bitrate?: number;
  resolution?: string;
  uptime?: number;
  model?: string;
  sensor?: string;
  viewers?: number;
  updatedAt?: number;
}

export interface WebRTCStatsData {
  rttMs: number;
  fps: number;
  bitrateKbps: number;
  packetsLost: number;
  packetLossPercent: number;
  jitterMs: number;
  codec: string;
  resolution: string;
  iceConnectionState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
