import React, { useState, useCallback } from 'react';
import { cn } from './lib/utils';
import { Sidebar, TabType } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DesignCanvas } from './components/DesignCanvas';
import { Preview3D } from './components/Preview3D';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BoxElement, ViewMode, BoxSide } from './types';
import { BoxType } from './types/box';

interface Template {
  id: string;
  name: string;
  elements: BoxElement[];
  boxTypeId: string;
  canvasColor: string;
  canvasTexture: string | null;
  thumbnail?: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'default-1',
    name: '简约自然风',
    boxTypeId: 'standard-box',
    canvasColor: '#D2B48C',
    canvasTexture: null,
    elements: [
      {
        id: 't1-1',
        type: 'text',
        side: 'outside',
        x: 400,
        y: 250,
        width: 120,
        height: 40,
        rotation: 0,
        opacity: 1,
        text: 'NATURAL',
        fontSize: 28,
        fill: '#5D4037',
      },
      {
        id: 't1-2',
        type: 'image',
        side: 'outside',
        x: 400,
        y: 350,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 0.8,
        src: 'https://cdn-icons-png.flaticon.com/512/104/104647.png',
      }
    ]
  },
  {
    id: 'default-2',
    name: '极简白设计',
    boxTypeId: 'pizza-box',
    canvasColor: '#FFFFFF',
    canvasTexture: null,
    elements: [
      {
        id: 't2-1',
        type: 'text',
        side: 'outside',
        x: 500,
        y: 400,
        width: 200,
        height: 60,
        rotation: 0,
        opacity: 1,
        text: 'MINIMAL',
        fontSize: 40,
        fill: '#333333',
      }
    ]
  }
];

import { BOX_TEMPLATES } from './constants/boxTemplates';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2, Play, Pause, RotateCcw, Upload, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Barcode, QrCode, Box, Trash2 } from 'lucide-react';
import { CodeModal } from './components/CodeModal';

const INITIAL_ELEMENTS: BoxElement[] = [
  {
    id: '1',
    type: 'image',
    side: 'outside',
    x: 510, // Center X (was 450 top-left)
    y: 340, // Center Y (was 250 top-left)
    width: 120,
    height: 180,
    rotation: 0,
    opacity: 1,
    src: 'https://picsum.photos/seed/character/400/600',
  }
];

export default function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [elements, setElements] = useState<BoxElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [unfoldProgress, setUnfoldProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<1 | -1>(1);
  const [activeTab, setActiveTab] = useState<TabType>('asset');
  const [canvasColor, setCanvasColor] = useState('#D2B48C');
  const [canvasTexture, setCanvasTexture] = useState<string | null>(null);
  const [boxType, setBoxType] = useState<BoxType>(BOX_TEMPLATES[0]);
  const [currentSide, setCurrentSide] = useState<BoxSide>('outside');
  const [modalType, setModalType] = useState<'barcode' | 'qrcode' | null>(null);
  const [miniPreviewSize, setMiniPreviewSize] = useState({ width: 256, height: 192 });
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem('box-templates');
      const userTemplates = saved ? JSON.parse(saved) : [];
      return [...DEFAULT_TEMPLATES, ...userTemplates];
    } catch (e) {
      return DEFAULT_TEMPLATES;
    }
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    'https://picsum.photos/seed/user1/400/400',
    'https://picsum.photos/seed/user2/400/400',
  ]);

  // Auto-play animation logic
  React.useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let frameId: number;

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setUnfoldProgress(prev => {
        const step = (deltaTime / 2000) * animationDirection; // 2 seconds for full cycle
        const next = prev + step;
        
        if (animationDirection === 1 && next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        if (animationDirection === -1 && next <= 0) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, animationDirection]);

  const handleAddCodeToCanvas = (dataUrl: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newElement: BoxElement = {
      id: newId,
      type: 'image',
      side: currentSide,
      x: 510,
      y: 340,
      width: modalType === 'barcode' ? 200 : 150,
      height: modalType === 'barcode' ? 100 : 150,
      rotation: 0,
      opacity: 1,
      src: dataUrl,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newId);
    setModalType(null);
  };

  const handleSaveTemplate = () => {
    const newTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: `我的模板 ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      elements: elements,
      boxTypeId: boxType.id,
      canvasColor: canvasColor,
      canvasTexture: canvasTexture,
    };
    
    const userTemplates = templates.filter(t => !DEFAULT_TEMPLATES.find(dt => dt.id === t.id));
    const updatedUserTemplates = [...userTemplates, newTemplate];
    localStorage.setItem('box-templates', JSON.stringify(updatedUserTemplates));
    setTemplates([...DEFAULT_TEMPLATES, ...updatedUserTemplates]);
    alert('当前设计已保存为模板！');
  };

  const handleLoadTemplate = (template: Template) => {
    const targetBox = BOX_TEMPLATES.find(b => b.id === template.boxTypeId) || BOX_TEMPLATES[0];
    setBoxType(targetBox);
    setElements(template.elements);
    setCanvasColor(template.canvasColor);
    setCanvasTexture(template.canvasTexture);
    setSelectedId(null);
    setActiveTab('layer'); // Switch to layer tab to show elements
  };

  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个模板吗？')) return;
    
    const userTemplates = templates.filter(t => !DEFAULT_TEMPLATES.find(dt => dt.id === t.id) && t.id !== templateId);
    localStorage.setItem('box-templates', JSON.stringify(userTemplates));
    setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
  };

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  const handleUpdateElement = useCallback((attrs: Partial<BoxElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, ...attrs } : el));
  }, [selectedId]);

  const handleDeleteElement = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleAnalyzeImage = async () => {
    if (!selectedElement || !selectedElement.src) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // In a real app, we'd fetch the image and send it as inlineData
      // For this demo, we'll use a text prompt about the image URL
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this packaging design element (image URL: ${selectedElement.src}). 
        Provide a brief professional design critique and suggestions for improvement. 
        Focus on how it would look on a 3D box. Keep it under 100 words.`,
      });
      
      setAnalysisResult(response.text || "未能生成分析结果。");
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisResult("AI 分析过程中出现错误，请稍后再试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMoveElement = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1) return prev;
      
      const newElements = [...prev];
      const element = newElements[index];
      
      if (direction === 'front') {
        newElements.splice(index, 1);
        newElements.push(element);
        return newElements;
      }
      
      if (direction === 'back') {
        newElements.splice(index, 1);
        newElements.unshift(element);
        return newElements;
      }
      
      const targetIndex = direction === 'up' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= newElements.length) return prev;
      
      // Swap
      [newElements[index], newElements[targetIndex]] = [newElements[targetIndex], newElements[index]];
      return newElements;
    });
  };

  const handleUpload = () => {
    const newImageUrl = `https://picsum.photos/seed/${Math.random()}/400/400`;
    setUploadedImages(prev => [newImageUrl, ...prev]);
  };

  const handleAddImageToCanvas = (src: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newElement: BoxElement = {
      id: newId,
      type: 'image',
      side: currentSide,
      x: 510,
      y: 340,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      src: src,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newId);
  };

  const handleAddText = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newElement: BoxElement = {
      id: newId,
      type: 'text',
      side: currentSide,
      x: 510,
      y: 340,
      width: 100,
      height: 40,
      rotation: 0,
      opacity: 1,
      text: '双击编辑文字',
      fontSize: 24,
      fill: '#000000',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newId);
  };

  const handleAddBuiltInAsset = (src: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newElement: BoxElement = {
      id: newId,
      type: 'image',
      side: currentSide,
      x: 510,
      y: 340,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      src: src,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newId);
  };

  const startResizingMiniPreview = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = miniPreviewSize.width;
    const startHeight = miniPreviewSize.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const deltaY = moveEvent.clientY - startY;
      
      setMiniPreviewSize({
        width: Math.max(160, Math.min(800, startWidth + deltaX)),
        height: Math.max(120, Math.min(600, startHeight + deltaY))
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'nesw-resize';
  }, [miniPreviewSize]);

  const BUILT_IN_ASSETS = [
    { id: 'recycle', src: 'https://cdn-icons-png.flaticon.com/512/104/104647.png', category: '图标' },
    { id: 'trash', src: 'https://cdn-icons-png.flaticon.com/512/104/104648.png', category: '图标' },
    { id: 'iso', src: 'https://cdn-icons-png.flaticon.com/512/104/104649.png', category: '图标' },
    { id: 'ce', src: 'https://cdn-icons-png.flaticon.com/512/104/104650.png', category: '图标' },
    { id: 'fda', src: 'https://cdn-icons-png.flaticon.com/512/104/104651.png', category: '图标' },
    { id: 'rohs', src: 'https://cdn-icons-png.flaticon.com/512/104/104652.png', category: '图标' },
    { id: 'square', src: 'https://cdn-icons-png.flaticon.com/512/104/104653.png', category: '形状' },
    { id: 'triangle', src: 'https://cdn-icons-png.flaticon.com/512/104/104654.png', category: '形状' },
    { id: 'circle', src: 'https://cdn-icons-png.flaticon.com/512/104/104655.png', category: '形状' },
  ];

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 font-sans overflow-hidden">
      <TopBar 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        currentSide={currentSide} 
        setCurrentSide={setCurrentSide} 
        onSaveTemplate={handleSaveTemplate}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex relative overflow-hidden">
          {/* Left Side Panel */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">
                {activeTab === 'asset' && '素材库'}
                {activeTab === 'text' && '文字工具'}
                {activeTab === 'layer' && '图层管理'}
                {activeTab === 'box' && '盒型选择'}
                {activeTab === 'template' && '设计模板'}
                {activeTab === 'tool' && '实用工具'}
                {activeTab === 'upload' && '上传中心'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* ASSET TAB - Built-in Assets */}
              {activeTab === 'asset' && (
                <div className="flex flex-col">
                  <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-50">
                    <div className="relative mb-4">
                      <input 
                        type="text" 
                        placeholder="输入素材关键字" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-md py-2 pl-8 pr-4 text-xs focus:outline-none focus:border-orange-200"
                      />
                      <Sparkles className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                    </div>
                    
                    <div className="flex items-center gap-6 text-[13px] font-medium text-gray-500 mb-4 px-1">
                      <button className="text-orange-500 relative">
                        素材分类
                        <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></span>
                      </button>
                      <button className="hover:text-orange-500 transition-colors">我的收藏</button>
                      <button className="hover:text-orange-500 transition-colors">我购买的</button>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap px-1">
                      <button className="text-orange-500 font-bold">全部</button>
                      <button className="hover:text-orange-500 transition-colors">形状</button>
                      <button className="hover:text-orange-500 transition-colors">图标</button>
                      <button className="hover:text-orange-500 transition-colors">插画</button>
                      <button className="hover:text-orange-500 transition-colors">抠图</button>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-3 gap-2">
                    {/* Mock grid of built-in assets */}
                    {Array.from({ length: 24 }).map((_, i) => {
                      const asset = BUILT_IN_ASSETS[i % BUILT_IN_ASSETS.length];
                      return (
                        <div 
                          key={i}
                          onClick={() => handleAddBuiltInAsset(asset.src)}
                          className="aspect-square bg-gray-50 rounded-md border border-transparent hover:border-orange-200 cursor-pointer flex items-center justify-center p-2 transition-all group"
                        >
                          <img 
                            src={asset.src} 
                            alt="Built-in Asset" 
                            className="w-full h-full object-contain grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TOOL TAB */}
              {activeTab === 'tool' && (
                <div className="p-4 flex flex-col gap-4">
                  <button 
                    onClick={() => setModalType('barcode')}
                    className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:border-orange-100 transition-colors">
                      <Barcode size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">条形码</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">快速生成一维码支持4种码制</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setModalType('qrcode')}
                    className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:border-orange-100 transition-colors">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">二维码</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">快速生成二维码设计使用</div>
                    </div>
                  </button>
                </div>
              )}

              {/* UPLOAD TAB - User Uploaded Assets */}
              {activeTab === 'upload' && (
                <div className="p-4 flex flex-col gap-4">
                  <button 
                    onClick={handleUpload}
                    className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Upload size={16} /> 上传图片
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">支持 JPG/PNG/SVG 格式</p>
                  
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">我的上传</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((src, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-square bg-gray-50 rounded-md border border-transparent hover:border-orange-200 cursor-pointer overflow-hidden p-2 transition-all group"
                          onClick={() => handleAddImageToCanvas(src)}
                        >
                          <img src={src} alt="Uploaded" className="w-full h-full object-contain group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEXT TAB */}
              {activeTab === 'text' && (
                <div className="p-4 flex flex-col gap-4">
                  <button 
                    onClick={handleAddText}
                    className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="text-lg font-serif">T</span> 添加文字内容
                  </button>
                  
                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">预设样式</h3>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleAddText} className="text-left p-3 border border-gray-100 rounded hover:border-orange-200 hover:bg-orange-50 transition-all">
                        <div className="text-lg font-bold">添加大标题</div>
                      </button>
                      <button onClick={handleAddText} className="text-left p-3 border border-gray-100 rounded hover:border-orange-200 hover:bg-orange-50 transition-all">
                        <div className="text-sm font-medium">添加副标题</div>
                      </button>
                      <button onClick={handleAddText} className="text-left p-3 border border-gray-100 rounded hover:border-orange-200 hover:bg-orange-50 transition-all">
                        <div className="text-xs">添加正文内容</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LAYER TAB */}
              {activeTab === 'layer' && (
                <div className="p-4 flex flex-col gap-2">
                  {elements.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs italic">暂无图层</div>
                  ) : (
                    [...elements].reverse().map(el => (
                      <div 
                        key={el.id}
                        onClick={() => setSelectedId(el.id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all group",
                          selectedId === el.id ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="w-10 h-10 bg-gray-50 rounded border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {el.type === 'image' ? (
                            <img src={el.src} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xs font-bold" style={{ color: el.fill }}>T</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-gray-700 truncate">
                            {el.type === 'image' ? '图片素材' : el.text}
                          </div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-tighter">
                            {el.type} • ID: {el.id.slice(0, 4)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveElement(el.id, 'front');
                            }}
                            disabled={elements.indexOf(el) === elements.length - 1}
                            className="text-gray-400 hover:text-orange-500 p-0.5 disabled:opacity-20 disabled:hover:text-gray-400"
                            title="置于顶层"
                          >
                            <ChevronsUp size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveElement(el.id, 'up');
                            }}
                            disabled={elements.indexOf(el) === elements.length - 1}
                            className="text-gray-400 hover:text-orange-500 p-0.5 disabled:opacity-20 disabled:hover:text-gray-400"
                            title="上移一层"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveElement(el.id, 'down');
                            }}
                            disabled={elements.indexOf(el) === 0}
                            className="text-gray-400 hover:text-orange-500 p-0.5 disabled:opacity-20 disabled:hover:text-gray-400"
                            title="下移一层"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveElement(el.id, 'back');
                            }}
                            disabled={elements.indexOf(el) === 0}
                            className="text-gray-400 hover:text-orange-500 p-0.5 disabled:opacity-20 disabled:hover:text-gray-400"
                            title="置于底层"
                          >
                            <ChevronsDown size={14} />
                          </button>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                            handleDeleteElement();
                          }}
                          className="text-gray-300 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Placeholder for other tabs */}
              {activeTab === 'box' && (
                <div className="flex flex-col gap-4 p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {BOX_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setBoxType(template)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left group",
                          boxType.id === template.id 
                            ? "border-orange-500 bg-orange-50 shadow-sm" 
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded flex items-center justify-center transition-colors",
                          boxType.id === template.id ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                        )}>
                          <Box size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{template.name}</div>
                          <div className="text-[10px] text-gray-400">
                            {template.box3D.w}x{template.box3D.h}x{template.box3D.d} mm
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'template' && (
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all bg-gray-50"
                      >
                        <div className="aspect-[4/3] bg-white flex items-center justify-center relative overflow-hidden">
                          {/* Simple preview representation */}
                          <div 
                            className="w-2/3 h-2/3 rounded shadow-sm border border-gray-100 flex items-center justify-center text-[8px] text-gray-300"
                            style={{ backgroundColor: template.canvasColor }}
                          >
                            {template.name}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-full font-bold">使用模板</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white border-t border-gray-50 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-700 truncate">{template.name}</div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {BOX_TEMPLATES.find(b => b.id === template.boxTypeId)?.name || '未知盒型'}
                            </div>
                          </div>
                          {!DEFAULT_TEMPLATES.find(dt => dt.id === template.id) && (
                            <button 
                              onClick={(e) => handleDeleteTemplate(e, template.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                              title="删除模板"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="flex-1 relative bg-[#F5F5F5]">
              {viewMode === '2d' ? (
                <DesignCanvas 
                  elements={elements.filter(el => el.side === currentSide)} 
                  selectedId={selectedId} 
                  onSelect={setSelectedId}
                  onChange={(newElements) => {
                    // Merge updated elements back into the main list
                    const otherSideElements = elements.filter(el => el.side !== currentSide);
                    setElements([...otherSideElements, ...newElements]);
                  }}
                  canvasColor={canvasColor}
                  canvasTexture={canvasTexture}
                  boxType={boxType}
                />
              ) : (
                <Preview3D 
                  elements={elements} 
                  unfoldProgress={unfoldProgress} 
                  canvasColor={canvasColor} 
                  canvasTexture={canvasTexture}
                  boxType={boxType}
                />
              )}

              {/* Floating 3D Mini Preview when in 2D mode */}
              {viewMode === '2d' && (
                <div 
                  className="absolute top-4 right-4 rounded-xl shadow-2xl border-4 border-white overflow-hidden z-20 group bg-gray-100"
                  style={{ width: miniPreviewSize.width, height: miniPreviewSize.height }}
                >
                  <Preview3D 
                    elements={elements} 
                    isMini 
                    unfoldProgress={unfoldProgress} 
                    canvasColor={canvasColor} 
                    canvasTexture={canvasTexture}
                    boxType={boxType}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <span className="text-white text-[10px] font-medium bg-black/40 px-2 py-1 rounded">3D 实时预览</span>
                  </div>

                  {/* Resize Handle - Bottom Left */}
                  <div 
                    onMouseDown={startResizingMiniPreview}
                    className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-30 flex items-end justify-start p-1 group/handle"
                    title="调整大小"
                  >
                    <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-gray-400 group-hover/handle:border-orange-500 transition-colors rounded-bl-sm" />
                  </div>
                </div>
              )}

              {/* Unfold Control Slider */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-gray-200 z-30 flex items-center gap-4 min-w-[350px]">
                <button 
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                    } else {
                      // Decide direction based on current progress to match the icon
                      const targetDirection = unfoldProgress >= 0.5 ? -1 : 1;
                      setAnimationDirection(targetDirection);
                      setIsPlaying(true);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm"
                  title={isPlaying ? "暂停" : (unfoldProgress >= 0.5 ? "折叠" : "展开")}
                >
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    unfoldProgress >= 0.5 ? <ChevronsDown size={16} /> : <ChevronsUp size={16} />
                  )}
                </button>

                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setUnfoldProgress(0);
                  }}
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
                  onChange={(e) => {
                    setIsPlaying(false);
                    setUnfoldProgress(parseFloat(e.target.value));
                  }}
                  className="flex-1 accent-orange-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-orange-600 w-10">{Math.round(unfoldProgress * 100)}%</span>
              </div>
            </div>
        </main>

        <PropertiesPanel 
          selectedElement={selectedElement}
          onUpdate={handleUpdateElement}
          onDelete={handleDeleteElement}
          onAnalyze={handleAnalyzeImage}
          canvasColor={canvasColor}
          onCanvasColorChange={(color) => {
            setCanvasColor(color);
            setCanvasTexture(null);
          }}
          canvasTexture={canvasTexture}
          onCanvasTextureChange={(tex) => {
            setCanvasTexture(tex);
            setCanvasColor('#FFFFFF');
          }}
        />
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {(isAnalyzing || analysisResult) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Sparkles size={20} />
                    <h2 className="font-bold">Gemini 智能设计分析</h2>
                  </div>
                  <button 
                    onClick={() => { setIsAnalyzing(false); setAnalysisResult(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="min-h-[100px] flex flex-col justify-center">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 className="animate-spin text-orange-500" size={32} />
                      <p className="text-sm text-gray-500">正在分析您的设计...</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed bg-orange-50 p-4 rounded-xl border border-orange-100">
                      {analysisResult}
                    </div>
                  )}
                </div>

                {!isAnalyzing && (
                  <button 
                    onClick={() => setAnalysisResult(null)}
                    className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                  >
                    我知道了
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Code Modal */}
      <CodeModal 
        isOpen={modalType !== null} 
        onClose={() => setModalType(null)} 
        type={modalType || 'barcode'} 
        onSave={handleAddCodeToCanvas}
      />

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex gap-4">
          <span>个人已使用 0.22M/100M</span>
          <span className="text-orange-500 cursor-pointer">扩充容量</span>
        </div>
        <div>模型ID: 100100</div>
      </footer>
    </div>
  );
}
