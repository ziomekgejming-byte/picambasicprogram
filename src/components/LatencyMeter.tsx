import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Info, Zap } from 'lucide-react';

export const LatencyMeter: React.FC<{ rttMs: number }> = ({ rttMs }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    let animId: number;
    let start = performance.now() - timeMs;

    const tick = () => {
      if (isRunning) {
        setTimeMs(performance.now() - start);
        animId = requestAnimationFrame(tick);
      }
    };

    if (isRunning) {
      animId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  const resetTimer = () => {
    setTimeMs(0);
  };

  const formatStopwatch = (msTotal: number) => {
    const mins = Math.floor(msTotal / 60000);
    const secs = Math.floor((msTotal % 60000) / 1000);
    const ms = Math.floor(msTotal % 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms
      .toString()
      .padStart(3, '0')}`;
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Wizualny tester opóźnienia typu Glass-to-Glass (End-to-End)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Skieruj kamerę Raspberry Pi na poniższy zegar milisekundowy, aby natychmiast odczytać bezwzględne opóźnienie transmisji
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Wstrzymaj' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Zeruj stoper"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Stopwatch display */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-center">
          <div className="text-xs text-neutral-500 font-mono mb-1 uppercase tracking-wider">
            Zegar milisekundowy wysokiej precyzji
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400 tabular-nums">
            {formatStopwatch(timeMs)}
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono">
            Szacowany RTT sieciowy: <span className="text-emerald-400 font-semibold">{rttMs} ms</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-neutral-400 space-y-2 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">1</span>
            <p>Skieruj obiektyw kamery Pi Cam na powyższy zegar lub umieść przed nim ekran telefonu.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">2</span>
            <p>Zrób zrzut ekranu (lub kliknij przycisk aparatu na podglądzie), obejmując zarówno zegar referencyjny, jak i podgląd na żywo.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">3</span>
            <p>Różnica czasu między zegarem na żywo a zegarem widocznym w kadrze to rzeczywiste opóźnienie <strong>Glass-to-Glass</strong> (zazwyczaj od 80 do 140 ms w WebRTC).</p>
          </div>
        </div>
      </div>
    </div>
  );
};
