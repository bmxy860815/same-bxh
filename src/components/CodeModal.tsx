import React, { useState, useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import * as QRCode from 'qrcode';
import { cn } from '../lib/utils';

type CodeType = 'barcode' | 'qrcode';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CodeType;
  onSave: (dataUrl: string) => void;
}

export function CodeModal({ isOpen, onClose, type, onSave }: CodeModalProps) {
  const [barcodeFormat, setBarcodeFormat] = useState('EAN13');
  const [barcodeValue, setBarcodeValue] = useState('0000000000000');
  const [qrContent, setQrContent] = useState('');
  const [qrType, setQrType] = useState<'url' | 'text' | 'wechat'>('url');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const generatePreview = async () => {
      if (type === 'barcode') {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, barcodeValue, {
            format: barcodeFormat,
            displayValue: true,
            fontSize: 20,
            margin: 10,
          });
          setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error('Barcode generation failed', err);
          setPreviewUrl(null);
        }
      } else {
        try {
          const url = await QRCode.toDataURL(qrContent || 'https://www.baoxiaohe.com', {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setPreviewUrl(url);
        } catch (err) {
          console.error('QR code generation failed', err);
          setPreviewUrl(null);
        }
      }
    };

    generatePreview();
  }, [isOpen, type, barcodeFormat, barcodeValue, qrContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {type === 'barcode' ? '编辑条形码' : '编辑二维码'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {type === 'barcode' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-600 w-16">码制：</label>
                <div className="flex-1 relative">
                  <select 
                    value={barcodeFormat}
                    onChange={(e) => setBarcodeFormat(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500 appearance-none"
                  >
                    <option value="EAN13">EAN13</option>
                    <option value="CODE128">CODE128</option>
                    <option value="UPC">UPC</option>
                    <option value="ITF14">ITF14</option>
                  </select>
                  <Info size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-600 w-16">码值：</label>
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                    placeholder="输入条码数值"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button onClick={() => setBarcodeValue('')} className="text-gray-300 hover:text-gray-500">
                      <X size={14} />
                    </button>
                    <Info size={14} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-600 w-16">内容类型：</label>
                <div className="flex gap-2">
                  {[
                    { id: 'url', label: '静态地址' },
                    { id: 'text', label: '文本' },
                    { id: 'wechat', label: '微信公众号' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setQrType(t.id as any)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-medium rounded-md border transition-all",
                        qrType === t.id 
                          ? "bg-orange-50 border-orange-500 text-orange-500" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-orange-500">
                  {qrType === 'url' && (
                    <div className="bg-gray-50 px-3 py-2 text-xs text-gray-400 border-r border-gray-200 flex items-center gap-1">
                      https:// <ChevronDown size={12} />
                    </div>
                  )}
                  <input 
                    type="text"
                    value={qrContent}
                    onChange={(e) => setQrContent(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm outline-none"
                    placeholder={qrType === 'url' ? "请输入网址" : "请输入内容"}
                  />
                </div>
                <p className="text-[10px] text-gray-400">示例：www.baoxiaohe.com</p>
                <p className="text-[10px] text-gray-400">使用前请自行测试</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center min-h-[160px]">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-32 object-contain" />
            ) : (
              <div className="text-gray-300 text-xs italic">预览生成中...</div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            取消
          </button>
          <button 
            onClick={() => previewUrl && onSave(previewUrl)}
            className="px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-lg shadow-orange-200"
          >
            保存并使用
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
