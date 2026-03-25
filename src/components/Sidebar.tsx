import React from 'react';
import { 
  Box, 
  Layout, 
  Image as ImageIcon, 
  Type, 
  Wrench, 
  Upload, 
  Layers, 
  HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'box' | 'template' | 'asset' | 'text' | 'tool' | 'upload' | 'layer';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const sidebarItems: { icon: any, label: string, id: TabType }[] = [
  { icon: Box, label: '模型', id: 'box' },
  { icon: Layout, label: '模板', id: 'template' },
  { icon: ImageIcon, label: '素材', id: 'asset' },
  { icon: Type, label: '文字', id: 'text' },
  { icon: Wrench, label: '工具', id: 'tool' },
  { icon: Upload, label: '上传', id: 'upload' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 z-10">
      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-2">
        包
      </div>
      
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 group transition-colors",
            activeTab === item.id ? "text-orange-500" : "text-gray-500 hover:text-orange-500"
          )}
        >
          <item.icon size={24} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}

      <div className="mt-auto flex flex-col items-center gap-6">
        <button 
          onClick={() => onTabChange('layer')}
          className={cn(
            "flex flex-col items-center gap-1 group transition-colors",
            activeTab === 'layer' ? "text-orange-500" : "text-gray-500 hover:text-orange-500"
          )}
        >
          <Layers size={20} strokeWidth={1.5} />
          <span className="text-[10px]">图层</span>
        </button>
        <button className="text-gray-500 hover:text-orange-500 flex flex-col items-center gap-1">
          <HelpCircle size={20} strokeWidth={1.5} />
          <span className="text-[10px]">帮助</span>
        </button>
      </div>
    </aside>
  );
}
