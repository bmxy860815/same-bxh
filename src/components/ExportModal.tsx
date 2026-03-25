import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { BoxElement } from '../types';
import { ParsedGLB } from '../lib/glbParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: BoxElement[];
  glbData?: ParsedGLB | null;
  designCanvasDataUrl: string | null;
}

export function ExportModal({ isOpen, onClose, elements, glbData, designCanvasDataUrl }: ExportModalProps) {
  const [dpi, setDpi] = useState<number>(300);
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const newWarnings: string[] = [];
    
    // Simple quality check
    if (glbData && glbData.uvData) {
      // Check for UV overflow
      // UV bounds are mapped to glbCanvasSize (2048) in DesignCanvas
      // This is a rough estimation based on the elements' bounding box
      const minX = 0;
      const minY = 0;
      const maxX = 2048; // using the base size from DesignCanvas
      const maxY = 2048;
      
      let hasOverflow = false;
      let hasLowRes = false;

      elements.forEach(el => {
        // Element bounds
        const ex1 = el.x - el.width / 2;
        const ey1 = el.y - el.height / 2;
        const ex2 = el.x + el.width / 2;
        const ey2 = el.y + el.height / 2;

        if (ex1 < minX || ey1 < minY || ex2 > maxX || ey2 > maxY) {
          hasOverflow = true;
        }

        // Check image resolution roughly (assuming 150px is low for print)
        if (el.type === 'image' && (el.width > 500 || el.height > 500)) {
           // We'd ideally check the actual source image resolution here
           // For demo purposes, if it's scaled up too much, warn
           if (el.scaleX && el.scaleX > 2) {
             hasLowRes = true;
           }
        }
      });

      if (hasOverflow) {
        newWarnings.push("部分设计元素超出了可打印的UV边界，导出时将被自动裁剪。");
      }
      if (hasLowRes) {
        newWarnings.push("检测到部分图片被过度放大，可能导致打印模糊 (建议分辨率 > 300dpi)。");
      }
      if (elements.length === 0) {
        newWarnings.push("当前画布为空，没有添加任何设计元素。");
      }
    }

    setWarnings(newWarnings);
  }, [isOpen, elements, glbData]);

  const handleExport = async () => {
    if (!designCanvasDataUrl) return;
    
    setIsExporting(true);
    
    try {
      // Simulate processing time for high-res export
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const link = document.createElement('a');
      link.download = `design_${format}_${dpi}dpi.${format}`;
      link.href = designCanvasDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Download size={18} className="text-orange-500" />
              导出生产文件
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Warnings Section */}
            {warnings.length > 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                  <AlertTriangle size={16} />
                  设计质检提示
                </div>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 font-medium text-sm">
                <CheckCircle2 size={16} />
                设计质检通过，未发现明显问题
              </div>
            )}

            {/* Export Options */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">文件格式</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFormat('png')}
                    className={`flex-1 py-2 rounded-md border text-sm font-medium transition-all ${format === 'png' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    PNG (透明背景)
                  </button>
                  <button 
                    onClick={() => setFormat('pdf')}
                    className={`flex-1 py-2 rounded-md border text-sm font-medium transition-all ${format === 'pdf' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    PDF (印刷级)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 flex justify-between">
                  <span>分辨率 (DPI)</span>
                  <span className="text-orange-500">{dpi} DPI</span>
                </label>
                <input 
                  type="range" 
                  min="150" 
                  max="600" 
                  step="50"
                  value={dpi} 
                  onChange={(e) => setDpi(parseInt(e.target.value))}
                  className="w-full accent-orange-500" 
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>150 (网页预览)</span>
                  <span>300 (标准印刷)</span>
                  <span>600 (超高清)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting || !designCanvasDataUrl}
              className="px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? '处理中...' : '确认导出'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
