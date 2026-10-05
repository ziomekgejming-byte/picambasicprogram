import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Download,
  Cpu,
  Layers,
  FileCode,
  Play,
  Settings2,
  HardDrive,
  Info,
} from 'lucide-react';

export const PiSetupGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'python' | 'gst' | 'systemd' | 'hardware'>('quick');

  const currentHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const httpProto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  const wsUrl = `${protocol}//${currentHost}/ws`;
  const serverUrl = `${httpProto}//${currentHost}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickStartCmd = `curl -sSL "${serverUrl}/api/scripts/setup.sh" | bash`;
  const runManualCmd = `python3 picam_streamer.py --server "${wsUrl}" --stream picam-default --width 1280 --height 720 --fps 30`;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Centrum wdrożenia i konfiguracji Raspberry Pi Cam
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Kompletne środowisko transmisji WebRTC z minimalnym opóźnieniem dla Raspberry Pi OS (Bookworm / Bullseye)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'quick', label: '1-Kliknięcie (Szybki start)' },
            { id: 'python', label: 'Skrypt Python (aiortc)' },
            { id: 'gst', label: 'GStreamer WHIP' },
            { id: 'systemd', label: 'Usługa systemd' },
            { id: 'hardware', label: 'Kompatybilność' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Szybki Start */}
      {activeTab === 'quick' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Zautomatyzowana instalacja na Raspberry Pi (uruchom w terminalu Pi)
              </span>
              <button
                onClick={() => copyToClipboard(quickStartCmd, 'quick-cmd')}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {copiedId === 'quick-cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Skopiowano</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 rounded font-mono text-xs text-emerald-300 overflow-x-auto selection:bg-emerald-500/30">
              {quickStartCmd}
            </pre>
            <p className="text-[11px] text-neutral-400 mt-2">
              Polecenie automatycznie instaluje pakiety <code>python3-picamera2</code>, <code>aiortc</code>, pobiera skrypt nadajnika, konfiguruje usługę systemową <code>picam-webrtc</code> i uruchamia strumień.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
              <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                Podłączenie taśmy CSI
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Wepnij taśmę kamery do gniazda CAM/DISP. Niebieska strona taśmy skierowana w stronę portów Ethernet/USB (dla Pi 4/5).
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
              <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
                Weryfikacja sensora
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Wpisz <code>rpicam-hello -t 2000</code> w terminalu Pi, aby potwierdzić poprawne wykrycie sensora przez libcamera.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
              <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                Gotowe!
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Po uruchomieniu skryptu obraz z kamery pojawi się automatycznie na tej stronie w czasie &lt;150 ms.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Python Script */}
      {activeTab === 'python' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300">
              Samodzielny skrypt <code>picam_streamer.py</code> (Picamera2 + aiortc + WebSockets)
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`${serverUrl}/api/scripts/picam_streamer.py`}
                download="picam_streamer.py"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Pobierz .py
              </a>
              <button
                onClick={() => copyToClipboard(runManualCmd, 'manual-cmd')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors cursor-pointer border border-neutral-700"
              >
                {copiedId === 'manual-cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Skopiowano</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj polecenie</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded font-mono text-xs text-emerald-300 overflow-x-auto border border-neutral-800">
            {runManualCmd}
          </div>

          <div className="text-xs text-neutral-400 space-y-2 leading-relaxed">
            <p>
              Skrypt łączy się bezpośrednio z serwerem sygnalizacyjnym <code>{wsUrl}</code>, inicjuje sprzętowe kodowanie H.264 z minimalnym buforem i transmituje klatki za pośrednictwem protokołu <strong>WebRTC (SRTP/UDP)</strong>.
            </p>
            <p>
              Obsługuje również dwukierunkowy <strong>DataChannel</strong> do odbierania zmian ekspozycji, ostrości (autofocus), rozdzielczości oraz przesyła telemetrię temperatury układu Broadcom SoC.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: GStreamer WHIP */}
      {activeTab === 'gst' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300">
              Pipeline GStreamer z protokołem WHIP (WebRTC HTTP Ingestion)
            </span>
            <a
              href={`${serverUrl}/api/scripts/picam_gst.sh`}
              download="picam_gst.sh"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz skrypt .sh
            </a>
          </div>

          <pre className="p-3 bg-neutral-950 rounded font-mono text-xs text-neutral-200 overflow-x-auto border border-neutral-800">
{`# Przekierowanie sprzętowego kodera rpicam-vid do gstreamer whipclientsink
rpicam-vid -t 0 --inline --width 1280 --height 720 --framerate 30 --bitrate 3500000 -o - | \\
  gst-launch-1.0 -v fdsrc ! h264parse ! \\
  rtph264pay config-interval=1 pt=96 ! \\
  whipclientsink whip-endpoint="${serverUrl}/api/whip?stream=picam-default"`}
          </pre>

          <p className="text-xs text-neutral-400">
            Rozwiązanie oparte na standardzie <strong>RFC WHIP (WebRTC HTTP Ingestion Protocol)</strong>, idealne dla zaawansowanych instalacji IoT, systemów CCTV oraz integracji z serwerami MediaMTX / Janus.
          </p>
        </div>
      )}

      {/* Tab 4: Systemd Service */}
      {activeTab === 'systemd' && (
        <div className="space-y-4">
          <span className="text-xs text-neutral-300">
            Autostart w tle jako usługa systemowa Linux (Systemd)
          </span>

          <pre className="p-3 bg-neutral-950 rounded font-mono text-xs text-neutral-300 overflow-x-auto border border-neutral-800">
{`# /etc/systemd/system/picam-webrtc.service
[Unit]
Description=PiCam WebRTC Ultra-Low Latency Streamer
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/picam-webrtc
ExecStart=/usr/bin/python3 /home/pi/picam-webrtc/picam_streamer.py --server ${wsUrl}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target`}
          </pre>

          <div className="p-3 bg-neutral-950 rounded font-mono text-xs text-emerald-400 border border-neutral-800">
            sudo systemctl enable --now picam-webrtc.service
          </div>
        </div>
      )}

      {/* Tab 5: Hardware Guide */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Camera Module 3 (IMX708)</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              11.9 MP, autofocus PDAF, HDR. Optymalne ustawienie: 1080p @ 30/60 fps lub 720p @ 60 fps. Działa natywnie z <code>Picamera2</code>.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Camera Module 2 (IMX219)</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              8 MP, fixed focus. Obsługuje 1080p @ 30fps i 720p @ 60fps. Bardzo stabilny sensor o niskim poborze mocy.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Raspberry Pi HQ (IMX477)</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              12.3 MP z wymienną optyką C/CS. Znakomita czułość w słabym oświetleniu i kontrola głębi ostrości.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Raspberry Pi 5 / 4 / Zero 2W</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Pi 5 używa portów 22-pin MIPI CSI-2. Pi 4 / 3B+ używają standardowej taśmy 15-pin. Zero 2W wymaga wąskiej taśmy dedykowanej do serii Zero.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Włączanie kamery w config.txt</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              W systemie Bookworm upewnij się, że w <code>/boot/firmware/config.txt</code> aktywna jest linijka <code>camera_auto_detect=1</code>.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg">
            <div className="font-semibold text-neutral-200 mb-1">Minimalizacja opóźnienia</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Dla najniższego opóźnienia (&lt;100 ms) zalecane połączenie Ethernet lub Wi-Fi 5 GHz z bezpośrednim kodowaniem I-frame co 1 sekundę.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
