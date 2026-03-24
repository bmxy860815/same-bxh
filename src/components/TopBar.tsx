import React from 'react';
import { 
  FileText, 
  ChevronDown, 
  Undo2, 
  Redo2, 
  Printer, 
  Zap, 
  Download, 
  User 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TopBarProps {
  viewMode: '2d' | '3d';
  setViewMode: (mode: '2d' | '3d') => void;
  currentSide: 'outside' | 'inside';
  setCurrentSide: (side: 'outside' | 'inside') => void;
}

export function TopBar({ viewMode, setViewMode, currentSide, setCurrentSide }: TopBarProps) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
          文件 <ChevronDown size={14} />
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-3 text-gray-400">
          <button className="hover:text-gray-600"><Undo2 size={18} /></button>
          <button className="hover:text-gray-600"><Redo2 size={18} /></button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentSide('outside')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-md transition-all",
              currentSide === 'outside' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            外侧设计
          </button>
          <button
            onClick={() => setCurrentSide('inside')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-md transition-all",
              currentSide === 'inside' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            内侧设计
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('2d')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-md transition-all",
              viewMode === '2d' ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            2D设计
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-md transition-all",
              viewMode === '3d' ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            )}
          >
            3D预览
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
          <Printer size={14} /> 小批量印刷
        </button>
        <button className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 hover:bg-orange-100 px-4 py-1.5 rounded-md border border-orange-200">
          渲染
        </button>
        <button className="flex items-center gap-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-5 py-1.5 rounded-md shadow-sm">
          导出
        </button>
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 border border-orange-200 cursor-pointer">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
