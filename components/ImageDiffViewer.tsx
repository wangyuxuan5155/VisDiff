
import React, { useState } from 'react';
import { Discrepancy } from '../types';

interface ImageDiffViewerProps {
  designImage: string;
  implementationImage: string;
  discrepancies: Discrepancy[];
}

export const ImageDiffViewer: React.FC<ImageDiffViewerProps> = ({
  designImage,
  implementationImage,
  discrepancies,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'high': return '严重';
      case 'medium': return '中等';
      case 'low': return '轻微';
      default: return '未知';
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      'color': '颜色',
      'typography': '文字排版',
      'spacing': '间距',
      'alignment': '对齐',
      'layout': '布局',
      'other': '其他'
    };
    return map[cat] || cat;
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">设计视觉稿</h3>
          <div className="relative border rounded-xl overflow-hidden shadow-sm bg-white aspect-video md:aspect-auto">
            <img src={designImage} alt="Design" className="w-full h-full object-contain" />
            {discrepancies.map((d, idx) => d.location && (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`absolute border-2 transition-all cursor-help ${
                  hoveredIdx === idx ? 'opacity-100 scale-105 z-10' : 'opacity-60'
                } ${getSeverityColor(d.severity).replace('bg-', 'border-')}`}
                style={{
                  left: `${d.location.x}%`,
                  top: `${d.location.y}%`,
                  width: `${d.location.width}%`,
                  height: `${d.location.height}%`,
                }}
              >
                <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${getSeverityColor(d.severity)}`}>
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">实际页面实现</h3>
          <div className="border rounded-xl overflow-hidden shadow-sm bg-white aspect-video md:aspect-auto">
            <img src={implementationImage} alt="Implementation" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-4">详细差异项</h3>
        <div className="divide-y">
          {discrepancies.length === 0 ? (
            <p className="py-4 text-slate-500 italic">未发现显著差异，还原度非常高！</p>
          ) : (
            discrepancies.map((d, idx) => (
              <div 
                key={idx} 
                className={`py-4 flex gap-4 transition-colors ${hoveredIdx === idx ? 'bg-indigo-50/50' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${getSeverityColor(d.severity)}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{getCategoryLabel(d.category)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tight text-white ${getSeverityColor(d.severity)}`}>
                      {getSeverityLabel(d.severity)}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{d.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">设计预期</span>
                      <code className="text-slate-600 break-all">{d.expected}</code>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">实际效果</span>
                      <code className="text-indigo-600 font-semibold break-all">{d.actual}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
