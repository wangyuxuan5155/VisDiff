
import React from 'react';
import { ComparisonResult } from '../types';

interface HistoryListProps {
  history: ComparisonResult[];
  onSelect: (result: ComparisonResult) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">分析历史</h3>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            清空历史记录
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500">暂无历史记录，开始你的第一次走查吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div 
              key={item.id}
              className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-pointer"
              onClick={() => onSelect(item)}
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={item.designImage} alt="Design" className="w-1/2 h-full object-cover absolute left-0 border-r" />
                <img src={item.implementationImage} alt="Impl" className="w-1/2 h-full object-cover absolute right-0" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold bg-indigo-600 px-4 py-2 rounded-full text-sm">查看报告</span>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-bold shadow-sm">
                  {formatDate(item.timestamp)}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.report.score >= 90 ? 'bg-green-100 text-green-700' : 
                    item.report.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    还原度 {item.report.score}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 italic">
                  "{item.report.summary}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
