
import React, { useState, useEffect } from 'react';
import { analyzeFidelity } from './services/geminiService';
import { ComparisonResult } from './types';
import { FidelityChart } from './components/FidelityChart';
import { ImageDiffViewer } from './components/ImageDiffViewer';
import { HistoryList } from './components/HistoryList';

const STORAGE_KEY = 'visdiff_history';
const MAX_HISTORY = 5;

const App: React.FC = () => {
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [implementationFile, setImplementationFile] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [currentView, setCurrentView] = useState<'checker' | 'history'>('checker');
  const [history, setHistory] = useState<ComparisonResult[]>([]);

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

  const fetchUrlScreenshot = async (targetUrl: string): Promise<string> => {
    // 降低分辨率至 1024px 宽度以减小 Base64 体积，避免 RPC 500 错误
    const screenshotUrl = `https://image.thum.io/get/width/1024/crop/800/noanimate/${targetUrl}`;
    
    try {
      const response = await fetch(screenshotUrl);
      if (!response.ok) throw new Error("截图服务请求失败");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Screenshot fetch failed:", err);
      throw new Error("无法自动截取网页内容（可能是由于截图服务超时或图片过大）。请尝试手动上传截图。");
    }
  };

  const handleRunAnalysis = async () => {
    if (!designFile) {
      setError("请先上传视觉设计稿。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let finalImplImage = implementationFile;

      if (inputMode === 'url') {
        if (!url) throw new Error("请输入页面 URL。");
        finalImplImage = await fetchUrlScreenshot(url);
      }

      if (!finalImplImage) {
        throw new Error("请上传实现截图或提供有效的 URL。");
      }

      const report = await analyzeFidelity(designFile, finalImplImage);
      
      const newResult: ComparisonResult = {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: Date.now(),
        report,
        designImage: designFile,
        implementationImage: finalImplImage,
      };

      setResult(newResult);
      saveToHistory(newResult);
      
      // 成功完成后自动清空当前输入，方便下一次分析
      setDesignFile(null);
      setImplementationFile(null);
      setUrl('');
      setAuthToken('');
      
    } catch (err: any) {
      setError(err.message || "分析过程中发生错误，可能是图片数据过大，请尝试上传体积较小的截图。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const reportData = {
      ...result,
      exportDate: new Date().toISOString(),
      appName: "VisDiff AI"
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VisDiff-Report-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectHistory = (item: ComparisonResult) => {
    setResult(item);
    setCurrentView('checker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getColorDifferences = () => {
    if (!result) return { designDiff: [], implDiff: [] };
    const designColors = Array.from(new Set(result.report.colorPalette.design.map(c => c.toUpperCase())));
    const implColors = Array.from(new Set(result.report.colorPalette.implementation.map(c => c.toUpperCase())));
    
    return {
      designDiff: designColors.filter(c => !implColors.includes(c)),
      implDiff: implColors.filter(c => !designColors.includes(c))
    };
  };

  const { designDiff, implDiff } = getColorDifferences();

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('checker')}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              走查历史 {history.length > 0 && <span className="ml-1 bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">{history.length}</span>}
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
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                视觉还原度走查助手
              </h2>
              <p className="text-lg text-slate-600">
                自动对比视觉稿与前端界面，走查文字、颜色、样式、间距偏差。
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-600 font-bold">1</span>
                  上传设计视觉稿
                </h3>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-400 transition-colors bg-slate-50/50 min-h-[220px] flex items-center justify-center relative">
                  {designFile ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img src={designFile} alt="Preview" className="max-h-[200px] object-contain rounded-lg" />
                      <button 
                        onClick={() => setDesignFile(null)}
                        className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full">
                      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-indigo-600">点击上传视觉稿</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'design')} />
                    </label>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-600 font-bold">2</span>
                  待走查页面源
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button 
                      onClick={() => setInputMode('file')}
                      className={`flex-1 py-1.5 px-3 rounded-md shadow-sm text-sm font-semibold transition-all ${inputMode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      上传截图
                    </button>
                    <button 
                      onClick={() => setInputMode('url')}
                      className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all ${inputMode === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      输入 URL (自动截图)
                    </button>
                  </div>
                  
                  {inputMode === 'file' ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-400 transition-colors bg-slate-50/50 min-h-[200px] flex items-center justify-center">
                      {implementationFile ? (
                        <div className="relative group w-full flex items-center justify-center">
                          <img src={implementationFile} alt="Preview" className="max-h-[180px] object-contain rounded-lg" />
                          <button 
                            onClick={() => setImplementationFile(null)}
                            className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full">
                          <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="text-sm font-semibold text-indigo-600">上传待走查页面截图</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'impl')} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">页面 URL</label>
                        <input 
                          type="text" 
                          placeholder="https://example.com" 
                          className="w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          Token / Session
                        </label>
                        <input 
                          type="text" 
                          placeholder="在此输入 Token 或 Session 数据..." 
                          className="w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none font-mono"
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                        />
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                          <p><b>注意：</b>第三方截图服务无法直接使用 Token 访问内部系统。如果页面需要登录，<b>请手动截图并上传</b>。Token 功能目前仅用于辅助 AI 理解页面上下文。</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 mb-16">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !designFile || (inputMode === 'file' && !implementationFile) || (inputMode === 'url' && !url)}
                className={`px-16 py-5 rounded-full font-black text-xl shadow-2xl transition-all flex items-center gap-4 ${
                  isAnalyzing 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
                }`}
              >
                {isAnalyzing ? "AI 正在走查分析中..." : "开始还原度检测"}
              </button>
              {error && <p className="text-red-600 font-bold text-sm text-center max-w-lg bg-red-50 px-4 py-2 rounded-lg border border-red-100">{error}</p>}
            </div>

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-3xl border p-10 shadow-sm flex flex-col md:flex-row items-center gap-10">
                    <FidelityChart score={result.report.score} />
                    <div className="space-y-5 text-center md:text-left flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">走查总结</h3>
                        <button 
                          onClick={downloadReport}
                          className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-full hover:bg-indigo-100 transition-colors"
                        >
                          下载完整报告
                        </button>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-indigo-200 pl-4 bg-slate-50 py-3 rounded-r-lg">
                        "{result.report.summary}"
                      </p>
                    </div>
                  </div>

                  {/* 色值差异模块 */}
                  <div className="bg-white rounded-3xl border p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">色值差异</h4>
                    <div className="space-y-8">
                      {designDiff.length === 0 && implDiff.length === 0 ? (
                        <div className="py-4 text-center">
                           <div className="text-green-500 font-bold text-sm mb-1">色彩完美匹配</div>
                           <p className="text-slate-400 text-[10px]">未在设计稿与实现页之间发现明显色值偏差</p>
                        </div>
                      ) : (
                        <>
                          {designDiff.length > 0 && (
                            <div>
                              <span className="text-[10px] font-black text-red-500 block mb-3 bg-red-50 px-2 py-1 rounded inline-block uppercase tracking-widest">设计稿特有 (缺失)</span>
                              <div className="grid grid-cols-1 gap-2">
                                {designDiff.map((c, i) => (
                                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: c }} />
                                    <span className="text-xs font-mono font-bold text-slate-700">{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {implDiff.length > 0 && (
                            <div>
                              <span className="text-[10px] font-black text-indigo-500 block mb-3 bg-indigo-50 px-2 py-1 rounded inline-block uppercase tracking-widest">实现页特有 (偏差)</span>
                              <div className="grid grid-cols-1 gap-2">
                                {implDiff.map((c, i) => (
                                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: c }} />
                                    <span className="text-xs font-mono font-bold text-slate-700">{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
        <p className="font-medium">&copy; 2024 VisDiff AI. 自动化视觉还原走查服务.</p>
      </footer>
    </div>
  );
};

export default App;
