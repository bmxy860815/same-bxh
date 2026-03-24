import React from 'react';
import { 
  FlipHorizontal, 
  FlipVertical, 
  RotateCcw, 
  RotateCw, 
  Scissors, 
  Image as ImageIcon, 
  Type,
  Trash2, 
  Lock, 
  Eye, 
  Copy, 
  Layers,
  Sparkles
} from 'lucide-react';
import { BoxElement } from '../types';
import { cn } from '../lib/utils';

interface PropertiesPanelProps {
  selectedElement: BoxElement | null;
  onUpdate: (attrs: Partial<BoxElement>) => void;
  onDelete: () => void;
  onAnalyze: () => void;
  canvasColor: string;
  onCanvasColorChange: (color: string) => void;
  canvasTexture: string | null;
  onCanvasTextureChange: (texture: string | null) => void;
}

export function PropertiesPanel({ 
  selectedElement, 
  onUpdate, 
  onDelete, 
  onAnalyze,
  canvasColor,
  onCanvasColorChange,
  canvasTexture,
  onCanvasTextureChange
}: PropertiesPanelProps) {
  const [canvasTab, setCanvasTab] = React.useState<'color' | 'texture'>('color');

  if (!selectedElement) {
    return (
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-3 text-xs font-medium border-b-2 border-orange-500 text-orange-500">画布</button>
          <div className="flex-1"></div>
        </div>

        <div className="p-4 flex flex-col gap-8 overflow-y-auto flex-1">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                尺寸/材质 <span className="text-gray-300 font-normal">?</span>
              </h3>
              <button className="text-xs text-orange-500 bg-orange-50 px-3 py-1 rounded font-medium">编辑</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">制造尺寸(mm)</span>
                <span className="text-gray-600 font-medium">L:80 W:80 H:180</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">材质</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-[#D2B48C]"></div>
                  <span className="text-gray-600 font-medium">E瓦(三层)(1.5-2mm)</span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">厚度</span>
                <span className="text-gray-600 font-medium">1.5mm</span>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100 w-full"></div>

          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-4">颜色 / 背景</h3>
            
            <div className="flex p-1 bg-gray-100 rounded-md mb-4">
              <button 
                onClick={() => setCanvasTab('color')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded transition-all",
                  canvasTab === 'color' ? "bg-white shadow-sm" : "text-gray-500"
                )}
              >
                颜色
              </button>
              <button 
                onClick={() => setCanvasTab('texture')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded transition-all",
                  canvasTab === 'texture' ? "bg-white shadow-sm" : "text-gray-500"
                )}
              >
                纹理
              </button>
            </div>

            {canvasTab === 'color' ? (
              <div className="grid grid-cols-6 gap-2">
                {/* Transparent / Default option */}
                <button 
                  onClick={() => onCanvasColorChange('#D2B48C')}
                  className={cn(
                    "aspect-square rounded-md border transition-all flex items-center justify-center overflow-hidden",
                    canvasColor === '#D2B48C' && !canvasTexture ? "border-orange-500 scale-110 shadow-sm" : "border-gray-100 hover:border-gray-300"
                  )}
                  title="默认原色"
                >
                  <div className="w-full h-full bg-[#D2B48C] relative">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 3px)' }}></div>
                  </div>
                </button>

                {[
                  '#333333', '#FFFFFF', '#E53E3E', '#4299E1', '#9AE6B4', '#ED8936',
                  '#F6E05E', '#000000', '#38B2AC', '#ED64A6', '#B794F7', '#A0AEC0'
                ].map((color) => (
                  <button 
                    key={color}
                    onClick={() => onCanvasColorChange(color)}
                    className={cn(
                      "aspect-square rounded-md border transition-all",
                      canvasColor === color && !canvasTexture ? "border-orange-500 scale-110 shadow-sm" : "border-gray-100 hover:border-gray-300"
                    )}
                    style={{ 
                      backgroundColor: color,
                      backgroundImage: color === '#FFFFFF' ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)' : 'none',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px 4px, 4px 0'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kraft', name: '牛皮纸', url: 'https://picsum.photos/seed/kraft-paper/1024/1024' },
                  { id: 'corrugated', name: '瓦楞纸', url: 'https://picsum.photos/seed/cardboard/1024/1024' },
                  { id: 'white', name: '白卡纸', url: 'https://picsum.photos/seed/white-paper/1024/1024' },
                ].map((tex) => (
                  <button 
                    key={tex.id}
                    onClick={() => onCanvasTextureChange(tex.url)}
                    className={cn(
                      "flex flex-col gap-1 items-center p-1 rounded-md border transition-all",
                      canvasTexture === tex.url ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-gray-300"
                    )}
                  >
                    <div className="w-full aspect-square rounded overflow-hidden">
                      <img src={tex.url} alt={tex.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-[10px] text-gray-500">{tex.name}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button className="flex-1 py-3 text-xs font-medium border-b-2 border-orange-500 text-orange-500">
          {selectedElement.type === 'image' ? '图片' : '文字'}
        </button>
        <button className="flex-1 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50">画布</button>
      </div>

      <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
        {selectedElement.type === 'text' && (
          <section>
            <h3 className="text-xs font-bold text-gray-700 mb-3">文字内容</h3>
            <textarea 
              value={selectedElement.text} 
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded p-2 outline-none focus:border-orange-500 min-h-[60px] resize-none"
              placeholder="输入文字..."
            />
          </section>
        )}

        {selectedElement.type === 'text' && (
          <section>
            <h3 className="text-xs font-bold text-gray-700 mb-3">字体设置</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-1">大小</label>
                <div className="flex items-center border border-gray-200 rounded px-2 py-1">
                  <input 
                    type="number" 
                    value={selectedElement.fontSize} 
                    onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                    className="w-full text-xs outline-none" 
                  />
                  <span className="text-[10px] text-gray-400 ml-1">px</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-1">颜色</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1">
                  <input 
                    type="color" 
                    value={selectedElement.fill} 
                    onChange={(e) => onUpdate({ fill: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" 
                  />
                  <span className="text-[10px] text-gray-400 uppercase">{selectedElement.fill}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-gray-700 mb-3">快捷操作</h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button 
              onClick={() => onUpdate({ scaleX: (selectedElement.scaleX || 1) * -1 })}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
              title="水平翻转"
            >
              <FlipHorizontal size={16} />
            </button>
            <button 
              onClick={() => onUpdate({ scaleY: (selectedElement.scaleY || 1) * -1 })}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
              title="上下翻转"
            >
              <FlipVertical size={16} />
            </button>
            <button 
              onClick={() => onUpdate({ rotation: (selectedElement.rotation - 90) % 360 })}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
              title="逆时针旋转90°"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={() => onUpdate({ rotation: (selectedElement.rotation + 90) % 360 })}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
              title="顺时针旋转90°"
            >
              <RotateCw size={16} />
            </button>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-md">
            <button 
              onClick={() => onUpdate({ side: 'outside' })}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-medium rounded transition-all",
                selectedElement.side === 'outside' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              )}
            >
              外侧设计
            </button>
            <button 
              onClick={() => onUpdate({ side: 'inside' })}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-medium rounded transition-all",
                selectedElement.side === 'inside' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              )}
            >
              内侧设计
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-700 mb-3">尺寸</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-gray-200 rounded px-2 py-1">
              <input 
                type="number" 
                value={Math.round(selectedElement.width)} 
                onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
                className="w-full text-xs outline-none" 
              />
              <span className="text-[10px] text-gray-400 ml-1">mm</span>
            </div>
            <span className="text-gray-300">宽</span>
            <div className="flex-1 flex items-center border border-gray-200 rounded px-2 py-1">
              <input 
                type="number" 
                value={Math.round(selectedElement.height)} 
                onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
                className="w-full text-xs outline-none" 
              />
              <span className="text-[10px] text-gray-400 ml-1">mm</span>
            </div>
            <span className="text-gray-300">高</span>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-700">透明度</h3>
            <span className="text-xs text-gray-500">{Math.round(selectedElement.opacity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={selectedElement.opacity} 
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-orange-500" 
          />
        </section>

        <section className="flex flex-col gap-2">
          {selectedElement.type === 'image' ? (
            <>
              <div className="flex gap-2">
                <button 
                  onClick={onAnalyze}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded text-xs font-medium hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
                >
                  <Sparkles size={14} className="text-orange-500" /> 智能抠图
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded text-xs font-medium hover:bg-gray-50">
                  <Scissors size={14} /> 裁剪
                </button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded text-xs font-medium hover:bg-gray-50">
                替换图片
              </button>
            </>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded text-xs font-medium hover:bg-gray-50">
              <Type size={14} /> 更改字体
            </button>
          )}
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-700 mb-3">工艺</h3>
          <button className="w-full py-2 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:border-orange-300 hover:text-orange-400">
            + 添加工艺
          </button>
        </section>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex gap-4 text-gray-400">
          <button className="hover:text-gray-600"><Layers size={18} /></button>
          <button className="hover:text-gray-600"><Eye size={18} /></button>
          <button className="hover:text-gray-600"><Lock size={18} /></button>
          <button className="hover:text-gray-600"><Copy size={18} /></button>
        </div>
        <button 
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </aside>
  );
}
