
import React, { useState, useEffect } from 'react';
import { analyzeFidelity } from './services/geminiService';
import { ComparisonResult } from './types';
import { FidelityChart } from './components/FidelityChart';
import { ImageDiffViewer } from './components/ImageDiffViewer';
import { HistoryList } from './components/HistoryList';

const STORAGE_KEY = 'visdiff_history';
const MAX_HISTORY = 5; // 由于图片数据大，限制存储条数

const App: React.FC = () => {
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [implementationFile, setImplementationFile] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [currentView, setCurrentView] = useState<'checker' | 'history'>('checker');
  const [history, setHistory] = useState<ComparisonResult[]>([]);

  // 初始化加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newResult: ComparisonResult) => {
    const updatedHistory = [newResult, ...history].slice(0, MAX_HISTORY);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'design' | 'impl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (type === 'design') setDesignFile(base64);
        else setImplementationFile(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAnalysis = async () => {
    if (!designFile) {
      setError("请先上传视觉设计稿。");
      return;
    }
    
    if (inputMode === 'url' && url) {
        setError("由于浏览器安全限制（CORS），当前版本无法直接通过 URL 截图。请上传该页面的截图。");
        return;
    }

    if (!implementationFile) {
      setError("请上传待走查页面的截图。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const report = await analyzeFidelity(designFile, implementationFile);
      
      const newResult: ComparisonResult = {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: Date.now(),
        report,
        designImage: designFile,
        implementationImage: implementationFile,
      };

      setResult(newResult);
      saveToHistory(newResult);
    } catch (err: any) {
      setError(err.message || "分析过程中发生错误，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectHistory = (item: ComparisonResult) => {
    setResult(item);
    setDesignFile(item.designImage);
    setImplementationFile(item.implementationImage);
    setCurrentView('checker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('checker')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">VisDiff <span className="text-indigo-600">AI</span></h1>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => setCurrentView('checker')}
              className={`transition-colors ${currentView === 'checker' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              视觉走查
            </button>
            <button 
              onClick={() => setCurrentView('history')}
              className={`transition-colors ${currentView === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              历史记录 {history.length > 0 && <span className="ml-1 bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">{history.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'history' ? (
          <HistoryList 
            history={history} 
            onSelect={handleSelectHistory} 
            onClear={clearHistory} 
          />
        ) : (
          <>
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                AI 驱动的 UI 还原度检测
              </h2>
              <p className="text-lg text-slate-600">
                自动对比设计稿与实际页面，精准发现像素、字体及样式的细微偏差。
              </p>
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs">1</span>
                  上传视觉设计稿
                </h3>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-indigo-400 transition-colors bg-slate-50/50 min-h-[200px] flex items-center justify-center">
                  {designFile ? (
                    <div className="relative group w-full">
                      <img src={designFile} alt="Preview" className="max-h-[300px] mx-auto object-contain rounded-lg" />
                      <button 
                        onClick={() => setDesignFile(null)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-indigo-600">点击上传视觉稿</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'design')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs">2</span>
                  上传页面实现截图
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button 
                      onClick={() => setInputMode('file')}
                      className={`flex-1 py-1.5 px-3 rounded-md shadow-sm text-sm font-semibold transition-all ${inputMode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      本地图片
                    </button>
                    <button 
                      onClick={() => setInputMode('url')}
                      className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all ${inputMode === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      页面 URL
                    </button>
                  </div>
                  
                  {inputMode === 'file' ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-indigo-400 transition-colors bg-slate-50/50 min-h-[200px] flex items-center justify-center">
                      {implementationFile ? (
                        <div className="relative group w-full">
                          <img src={implementationFile} alt="Preview" className="max-h-[300px] mx-auto object-contain rounded-lg" />
                          <button 
                            onClick={() => setImplementationFile(null)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                          <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="text-sm font-semibold text-indigo-600">点击上传实现截图</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'impl')} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="请输入待走查的 URL" 
                          className="w-full pl-4 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-700">
                        <p>提示：当前版本需输入 URL 后并上传截图进行模拟走查。</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-4 mb-16">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !designFile || (!implementationFile && !url)}
                className={`px-12 py-4 rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-3 ${
                  isAnalyzing 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
                }`}
              >
                {isAnalyzing ? "正在分析..." : "开始走查分析"}
              </button>
              {error && <p className="text-red-500 font-medium text-sm text-center max-w-md">{error}</p>}
            </div>

            {/* Analysis Results */}
            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl border p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <FidelityChart score={result.report.score} />
                    <div className="space-y-4 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-slate-900">分析总结</h3>
                      <p className="text-slate-600 leading-relaxed italic">
                        "{result.report.summary}"
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <span className="block text-[10px] font-bold text-indigo-400 uppercase">发现差异点</span>
                          <span className="text-xl font-bold text-indigo-700">{result.report.discrepancies.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">色值提取</h4>
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-2">视觉稿调色板</span>
                        <div className="flex flex-wrap gap-2">
                          {result.report.colorPalette.design.map((c, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ImageDiffViewer 
                  designImage={result.designImage} 
                  implementationImage={result.implementationImage} 
                  discrepancies={result.report.discrepancies} 
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-20 border-t py-12 text-center text-slate-400 text-sm">
        <p>&copy; 2024 VisDiff AI. 为追求完美的开发者而生。</p>
      </footer>
    </div>
  );
};

export default App;
