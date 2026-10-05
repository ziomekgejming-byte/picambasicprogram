import React from 'react';
import { Camera, Radio, Terminal, Sliders, Activity } from 'lucide-react';
import { ConnectionState } from '../types';

interface HeaderProps {
  connectionState: ConnectionState;
  isProducerOnline: boolean;
  activeTab: 'stream' | 'controls' | 'telemetry' | 'setup';
  setActiveTab: (tab: 'stream' | 'controls' | 'telemetry' | 'setup') => void;
  isVirtualProducerRunning: boolean;
  onToggleVirtualProducer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  isProducerOnline,
  activeTab,
  setActiveTab,
  isVirtualProducerRunning,
  onToggleVirtualProducer,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>PiCam WebRTC</span>
        </a>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono pl-3 border-l border-neutral-800">
          <span
            className={`w-2 h-2 rounded-full ${
              isProducerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-neutral-400">
            {isProducerOnline
              ? isVirtualProducerRunning
                ? 'Wirtualny Pi Cam (Aktywny)'
                : 'Raspberry Pi (Online)'
              : 'Oczekiwanie na kamerę'}
          </span>
        </div>
      </div>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'stream' ? 'text-neutral-100 font-semibold' : 'hover:text-neutral-200'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          Podgląd na żywo
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'controls' ? 'text-neutral-100 font-semibold' : 'hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Kontrola sprzętowa
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'telemetry' ? 'text-neutral-100 font-semibold' : 'hover:text-neutral-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Telemetria i RTT
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'setup' ? 'text-neutral-100 font-semibold' : 'hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Konfiguracja Pi
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleVirtualProducer}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            isVirtualProducerRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 hover:text-white'
          }`}
          title="Uruchom symulator testowej kamery WebRTC bez podłączonego fizycznego Raspberry Pi"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isVirtualProducerRunning ? 'bg-amber-400' : 'bg-neutral-400'
            }`}
          />
          {isVirtualProducerRunning ? 'Wyłącz symulator' : 'Symulator testowy'}
        </button>
      </div>
    </header>
  );
};
