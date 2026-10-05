import React from 'react';
import { TelemetryData, WebRTCStatsData, ConnectionState } from '../types';
import {
  Activity,
  Cpu,
  Gauge,
  Layers,
  Network,
  Radio,
  ShieldCheck,
  Thermometer,
  Users,
  Clock,
} from 'lucide-react';

interface TelemetryPanelProps {
  stats: WebRTCStatsData;
  telemetry: TelemetryData;
  connectionState: ConnectionState;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  stats,
  telemetry,
  connectionState,
}) => {
  const getTempColor = (temp?: number) => {
    if (!temp) return 'text-neutral-400';
    if (temp < 60) return 'text-emerald-400';
    if (temp < 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* RTT Latency */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              Opóźnienie RTT
            </span>
          </div>
          <div className="text-xl font-mono font-semibold text-emerald-400 tabular-nums">
            {stats.rttMs} <span className="text-xs font-normal text-neutral-400">ms</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Ultra-low latency</div>
        </div>

        {/* Live Framerate */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              FPS (Klatki)
            </span>
          </div>
          <div className="text-xl font-mono font-semibold text-neutral-100 tabular-nums">
            {stats.fps} <span className="text-xs font-normal text-neutral-400">kl/s</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Dekodowanie na bieżąco</div>
        </div>

        {/* Live Bitrate */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Przepływność
            </span>
          </div>
          <div className="text-xl font-mono font-semibold text-neutral-100 tabular-nums">
            {stats.bitrateKbps} <span className="text-xs font-normal text-neutral-400">kbps</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">RTP Inbound Video</div>
        </div>

        {/* Pi SoC Temperature */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
              Temp. CPU Pi
            </span>
          </div>
          <div
            className={`text-xl font-mono font-semibold tabular-nums ${getTempColor(
              telemetry.cpuTemp
            )}`}
          >
            {telemetry.cpuTemp ?? '42.0'}{' '}
            <span className="text-xs font-normal text-neutral-400">°C</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Broadcom SoC / VC4</div>
        </div>

        {/* Packet Loss */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Utrata pakietów
            </span>
          </div>
          <div className="text-xl font-mono font-semibold text-neutral-100 tabular-nums">
            {stats.packetLossPercent.toFixed(1)}{' '}
            <span className="text-xs font-normal text-neutral-400">%</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Zgubione: {stats.packetsLost}
          </div>
        </div>

        {/* Connected Viewers */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Widzowie
            </span>
          </div>
          <div className="text-xl font-mono font-semibold text-neutral-100 tabular-nums">
            {telemetry.viewers ?? 1}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Aktywne sesje P2P</div>
        </div>
      </div>

      {/* Deep Diagnostic Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-neutral-100 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Szczegóły protokołu WebRTC i sprzętu Raspberry Pi
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Model modułu kamery:</span>
              <span className="text-neutral-200">{telemetry.model || 'Raspberry Pi Camera Module 3'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Matryca światłoczuła (Sensor):</span>
              <span className="text-neutral-200">{telemetry.sensor || 'Sony IMX708 (11.9 MP)'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Sterownik linuksowy:</span>
              <span className="text-neutral-200">libcamera / v4l2 / bcm2835-unicam</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Aktywny kodek WebRTC:</span>
              <span className="text-emerald-400 font-semibold">{stats.codec}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Rozdzielczość bieżąca:</span>
              <span className="text-neutral-200">{stats.resolution}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Stan połączenia ICE:</span>
              <span className="text-emerald-400 uppercase font-semibold">
                {stats.iceConnectionState || connectionState}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Jitter sieciowy:</span>
              <span className="text-neutral-200">{stats.jitterMs} ms</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Status zasilania/throttling:</span>
              <span className="text-neutral-200">{telemetry.throttled || '0x0 (OK)'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Czas pracy streamu (Uptime):</span>
              <span className="text-neutral-200">{formatUptime(telemetry.uptime)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400 font-sans">Serwery STUN:</span>
              <span className="text-neutral-400">stun.l.google.com:19302</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
