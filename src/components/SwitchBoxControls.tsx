import React from 'react';
import { ChevronsDown, ChevronsUp, Pause, RotateCcw } from 'lucide-react';

interface SwitchBoxControlsProps {
  visible: boolean;
  unfoldProgress: number;
  isPlaying: boolean;
  onToggle: () => void;
  onReset: () => void;
  onProgressChange: (value: number) => void;
}

export function SwitchBoxControls({
  visible,
  unfoldProgress,
  isPlaying,
  onToggle,
  onReset,
  onProgressChange
}: SwitchBoxControlsProps) {
  if (!visible) return null;

  return (
    <div
      data-testid="switch-box-controls"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-gray-200 z-30 flex items-center gap-4 min-w-[350px]"
    >
      <button
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm"
        title={isPlaying ? '暂停' : (unfoldProgress >= 0.5 ? '折叠' : '展开')}
      >
        {isPlaying ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          unfoldProgress >= 0.5 ? <ChevronsDown size={16} /> : <ChevronsUp size={16} />
        )}
      </button>

      <button
        onClick={onReset}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        title="重置"
      >
        <RotateCcw size={16} />
      </button>

      <div className="h-4 w-[1px] bg-gray-200 mx-1" />

      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">展开进度</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={unfoldProgress}
        onChange={(e) => onProgressChange(parseFloat(e.target.value))}
        className="flex-1 accent-orange-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-xs font-mono font-bold text-orange-600 w-10">{Math.round(unfoldProgress * 100)}%</span>
    </div>
  );
}
