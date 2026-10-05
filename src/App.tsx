/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWebRTCStream } from './hooks/useWebRTCStream';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { CameraControls } from './components/CameraControls';
import { TelemetryPanel } from './components/TelemetryPanel';
import { PiSetupGuide } from './components/PiSetupGuide';
import { LatencyMeter } from './components/LatencyMeter';
import {
  Activity,
  Camera,
  Cpu,
  Download,
  Gauge,
  Info,
  Network,
  Radio,
  Sliders,
  Sparkles,
  Terminal,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'stream' | 'controls' | 'telemetry' | 'setup'>('stream');

  const {
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
  } = useWebRTCStream('picam-default');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Contract: 3 zones */}
      <Header
        connectionState={connectionState}
        isProducerOnline={isProducerOnline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVirtualProducerRunning={isVirtualProducerRunning}
        onToggleVirtualProducer={() => toggleVirtualProducer('test-card')}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner if camera is offline but ready to connect */}
        {!isProducerOnline && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-neutral-900/80 border border-amber-500/30 rounded-lg gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-100">
                  Oczekiwanie na sygnał z kamery Raspberry Pi
                </p>
                <p className="text-xs text-neutral-400">
                  Połącz kamerę uruchamiając skrypt nadajnika lub włącz symulator wirtualnego Pi Cam jednym kliknięciem.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
              <button
                onClick={() => toggleVirtualProducer('test-card')}
                className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Uruchom symulator testowy
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                Instrukcja Pi
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Live Stream Viewport */}
        {activeTab === 'stream' && (
          <div className="space-y-6">
            <VideoPlayer
              remoteStream={remoteStream}
              isProducerOnline={isProducerOnline}
              telemetry={telemetry}
              stats={stats}
              settings={settings}
              onRefresh={startWebRTCNegotiation}
              onToggleVirtualProducer={() => toggleVirtualProducer('test-card')}
              isVirtualProducerRunning={isVirtualProducerRunning}
              onOpenSetup={() => setActiveTab('setup')}
            />

            {/* Quick Metrics Bar below video */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3">
                <div className="text-neutral-400 text-xs flex items-center gap-1.5 mb-1">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  Opóźnienie (RTT)
                </div>
                <div className="text-lg font-mono font-semibold text-emerald-400 tabular-nums">
                  {stats.rttMs} <span className="text-xs font-normal text-neutral-400">ms</span>
                </div>
                <div className="text-[11px] text-neutral-400">SRTP / UDP bez buforowania</div>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3">
                <div className="text-neutral-400 text-xs flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  Klatkarz / Rozdzielczość
                </div>
                <div className="text-lg font-mono font-semibold text-neutral-100 tabular-nums">
                  {stats.fps} fps · <span className="text-sm font-normal text-neutral-400">{stats.resolution}</span>
                </div>
                <div className="text-[11px] text-neutral-400">Koder: {stats.codec}</div>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3">
                <div className="text-neutral-400 text-xs flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Bieżący Bitrate
                </div>
                <div className="text-lg font-mono font-semibold text-neutral-100 tabular-nums">
                  {stats.bitrateKbps} <span className="text-xs font-normal text-neutral-400">kbps</span>
                </div>
                <div className="text-[11px] text-neutral-400">Utrata pakietów: {stats.packetLossPercent}%</div>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3">
                <div className="text-neutral-400 text-xs flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Temperatura CPU Pi
                </div>
                <div className="text-lg font-mono font-semibold text-amber-400 tabular-nums">
                  {telemetry.cpuTemp ?? '42.5'} <span className="text-xs font-normal text-neutral-400">°C</span>
                </div>
                <div className="text-[11px] text-neutral-400">Zasilanie: {telemetry.throttled || 'Nominalne'}</div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('controls')}
                className="p-4 bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-neutral-300 font-medium text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-neutral-200">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Korekcja obrazu i ekspozycja
                  </span>
                  <span className="text-neutral-500 group-hover:text-emerald-400 transition-colors">→</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Zmień balans bieli (AWB), jasność, obrót (H-Flip/V-Flip) lub włącz autofocus.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className="p-4 bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-neutral-300 font-medium text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-neutral-200">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Wizualny pomiar opóźnienia
                  </span>
                  <span className="text-neutral-500 group-hover:text-emerald-400 transition-colors">→</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Skorzystaj ze zintegrowanego zegara milisekundowego do testu opóźnienia Glass-to-Glass.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('setup')}
                className="p-4 bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-neutral-300 font-medium text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-neutral-200">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Skrypty i instalacja na Pi
                  </span>
                  <span className="text-neutral-500 group-hover:text-emerald-400 transition-colors">→</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Pobierz gotowy skrypt Pythona <code>picam_streamer.py</code> lub komendę instalacyjną <code>curl</code>.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Camera Hardware Controls */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mini Video Preview */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <h4 className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Podgląd na żywo
                  </h4>
                  <VideoPlayer
                    remoteStream={remoteStream}
                    isProducerOnline={isProducerOnline}
                    telemetry={telemetry}
                    stats={stats}
                    settings={settings}
                    onRefresh={startWebRTCNegotiation}
                    onToggleVirtualProducer={() => toggleVirtualProducer('test-card')}
                    isVirtualProducerRunning={isVirtualProducerRunning}
                    onOpenSetup={() => setActiveTab('setup')}
                  />
                </div>
              </div>

              {/* Controls panel */}
              <div className="lg:col-span-2">
                <CameraControls
                  settings={settings}
                  onUpdate={sendControl}
                  isOnline={isProducerOnline}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry & Latency Benchmark */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <TelemetryPanel
              stats={stats}
              telemetry={telemetry}
              connectionState={connectionState}
            />
            <LatencyMeter rttMs={stats.rttMs} />
          </div>
        )}

        {/* Tab 4: Pi Setup & Deployment Guide */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <PiSetupGuide />
          </div>
        )}
      </main>

      {/* Footer: Clean, unboxed typography */}
      <footer className="border-t border-neutral-800/80 py-6 px-6 mt-auto bg-neutral-950 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-300">PiCam WebRTC Streaming Engine</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Ultraniskie opóźnienie &lt; 150ms</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>H.264 / libcamera</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>RFC 8825 (WebRTC)</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>RFC WHIP/WHEP</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Raspberry Pi OS Bookworm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
