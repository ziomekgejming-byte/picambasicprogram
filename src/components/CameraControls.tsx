import React from 'react';
import { CameraSettings } from '../types';
import {
  Sliders,
  Sun,
  Eye,
  FlipHorizontal,
  FlipVertical,
  Crosshair,
  Gauge,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CameraControlsProps {
  settings: CameraSettings;
  onUpdate: (command: Partial<CameraSettings>) => void;
  isOnline: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  settings,
  onUpdate,
  isOnline,
}) => {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Parametry i kontrola sprzętowa Pi Camera
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Polecenia są wysyłane w czasie rzeczywistym przez WebRTC DataChannel lub WebSocket do sterownika kamery
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}`}
          />
          <span>{isOnline ? 'Kamera aktywna' : 'Kamera offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Rozdzielczość i Klatkarz */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            Strumień i kodek H.264
          </h4>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Rozdzielczość sensora
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-md border border-neutral-800">
              {(
                [
                  { label: '1080p Full HD', val: '1920x1080' },
                  { label: '720p HD Ready', val: '1280x720' },
                  { label: '480p SD', val: '854x480' },
                  { label: '360p Low-BW', val: '640x360' },
                ] as const
              ).map((item) => (
                <button
                  key={item.val}
                  onClick={() => onUpdate({ resolution: item.val })}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer text-left ${
                    settings.resolution === item.val
                      ? 'bg-neutral-800 text-emerald-400 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Docelowy klatkarz (FPS)
            </label>
            <div className="flex gap-1.5 p-1 bg-neutral-950 rounded-md border border-neutral-800">
              {([15, 30, 60, 90] as const).map((fpsVal) => (
                <button
                  key={fpsVal}
                  onClick={() => onUpdate({ fps: fpsVal })}
                  className={`flex-1 py-1 text-xs font-mono rounded text-center transition-colors cursor-pointer ${
                    settings.fps === fpsVal
                      ? 'bg-neutral-800 text-emerald-400 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {fpsVal} fps
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-neutral-400">Limit przepływności (Bitrate)</span>
              <span className="font-mono text-emerald-400">{settings.bitrate} kbps</span>
            </div>
            <input
              type="range"
              min="500"
              max="8000"
              step="250"
              value={settings.bitrate}
              onChange={(e) => onUpdate({ bitrate: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Korekcja obrazu */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-emerald-400" />
            Jasność, Kontrast, Ekspozycja
          </h4>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">Jasność</span>
              <span className="font-mono text-neutral-200">{settings.brightness}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.brightness}
              onChange={(e) => onUpdate({ brightness: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">Kontrast</span>
              <span className="font-mono text-neutral-200">{settings.contrast}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.contrast}
              onChange={(e) => onUpdate({ contrast: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">Nasycenie kolorów</span>
              <span className="font-mono text-neutral-200">{settings.saturation}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.saturation}
              onChange={(e) => onUpdate({ saturation: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Balans Bieli (AWB)
            </label>
            <select
              value={settings.awbMode}
              onChange={(e) =>
                onUpdate({ awbMode: e.target.value as CameraSettings['awbMode'] })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="auto">Automatyczny (Auto AWB)</option>
              <option value="daylight">Światło dzienne (Daylight)</option>
              <option value="cloudy">Pochmurnie (Cloudy)</option>
              <option value="tungsten">Żarówka (Tungsten)</option>
              <option value="fluorescent">Świetlówka (Fluorescent)</option>
            </select>
          </div>
        </div>

        {/* Orientacja fizyczna i funkcje specjalne */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Opcje sprzętowe i montaż
          </h4>

          <div className="space-y-2">
            <button
              onClick={() => onUpdate({ hflip: !settings.hflip })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs cursor-pointer transition-colors ${
                settings.hflip
                  ? 'bg-neutral-800 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <FlipHorizontal className="w-4 h-4" />
                Odbicie poziome (H-Flip)
              </span>
              <span className="font-mono text-[11px]">{settings.hflip ? 'WŁĄCZONE' : 'WYŁ'}</span>
            </button>

            <button
              onClick={() => onUpdate({ vflip: !settings.vflip })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs cursor-pointer transition-colors ${
                settings.vflip
                  ? 'bg-neutral-800 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <FlipVertical className="w-4 h-4" />
                Odbicie pionowe (V-Flip / Odwrócony montaż)
              </span>
              <span className="font-mono text-[11px]">{settings.vflip ? 'WŁĄCZONE' : 'WYŁ'}</span>
            </button>

            <button
              onClick={() => onUpdate({ nightMode: !settings.nightMode })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs cursor-pointer transition-colors ${
                settings.nightMode
                  ? 'bg-neutral-800 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Tryb nocny / NoIR (Filtr podczerwieni)
              </span>
              <span className="font-mono text-[11px]">{settings.nightMode ? 'AKTYWNY' : 'WYŁ'}</span>
            </button>

            <button
              onClick={() => onUpdate({ autofocus: !settings.autofocus })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs cursor-pointer transition-colors ${
                settings.autofocus
                  ? 'bg-neutral-800 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                Autofocus ciągły (PDAF dla Camera v3)
              </span>
              <span className="font-mono text-[11px]">{settings.autofocus ? 'AUTO' : 'MANUAL'}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() =>
                onUpdate({
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  hflip: false,
                  vflip: false,
                  awbMode: 'auto',
                })
              }
              className="w-full py-1.5 text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 rounded transition-colors cursor-pointer"
            >
              Przywróć domyślne parametry obrazu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
