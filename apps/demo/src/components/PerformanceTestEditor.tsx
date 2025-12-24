import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Zap, 
  Layers, 
  Play, 
  Pause, 
  Gauge, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { EditorBlock, useLoroEditor } from 'nextext-editor';

interface PerformanceMetrics {
  domNodes: number;
  fps: number;
  memoryUsage: number;
  renderTime: number;
  scrollFPS: number;
}

export const PerformanceTestEditor: React.FC = () => {
  const [blockCount, setBlockCount] = useState(1000);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    domNodes: 0,
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    scrollFPS: 60,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const { content, updateContent } = useLoroEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<number[]>([]);
  const autoScrollIntervalRef = useRef<number | null>(null);

  const generateBlocks = useCallback((count: number) => {
    setIsGenerating(true);
    const startTime = performance.now();

    const paragraphTypes = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
    ];

    let htmlContent = '';

    for (let i = 0; i < count; i++) {
      const type = i % 10;
      if (type === 0) {
        htmlContent += '<h1>Heading 1 - Block ' + (i + 1) + '</h1>';
      } else if (type === 1) {
        htmlContent += '<h2>Heading 2 - Block ' + (i + 1) + '</h2>';
      } else if (type === 2) {
        htmlContent += '<h3>Heading 3 - Block ' + (i + 1) + '</h3>';
      } else if (type === 3) {
        htmlContent += '<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>';
      } else if (type === 4) {
        htmlContent += '<ol><li>Numbered item 1</li><li>Numbered item 2</li></ol>';
      } else if (type === 5) {
        htmlContent += '<blockquote>' + paragraphTypes[i % paragraphTypes.length] + '</blockquote>';
      } else if (type === 6) {
        htmlContent += '<pre><code>const example = "code block ' + (i + 1) + '";</code></pre>';
      } else {
        htmlContent += '<p><strong>Block ' + (i + 1) + ':</strong> ' + paragraphTypes[i % paragraphTypes.length] + '</p>';
      }
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    updateContent(htmlContent);
    setMetrics((prev) => ({ ...prev, renderTime }));
    setHasGenerated(true);
    setIsGenerating(false);
  }, [updateContent]);

  const clearEditor = useCallback(() => {
    updateContent('');
    setHasGenerated(false);
    setIsAutoScrolling(false);
    setMetrics({
      domNodes: 0,
      fps: 0,
      memoryUsage: 0,
      renderTime: 0,
      scrollFPS: 60,
    });
  }, [updateContent]);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      frames++;
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        fpsRef.current.push(fps);
        if (fpsRef.current.length > 10) fpsRef.current.shift();
        const avgFPS = Math.round(fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length);
        setMetrics((prev) => ({ ...prev, fps: avgFPS }));
        frames = 0;
        lastTime = currentTime;
      }
      frameId = requestAnimationFrame(measureFPS);
    };

    frameId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const editorContainer = document.querySelector('[data-editor-scroll-container]') as HTMLElement | null;
    if (!editorContainer) return;

    let scrollFrameCount = 0;
    let lastScrollFPSUpdate = performance.now();
    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let animationFrameId: number;

    const measureScrollPerformance = () => {
      const currentTime = performance.now();
      if (isScrolling) scrollFrameCount++;
      if (currentTime >= lastScrollFPSUpdate + 1000) {
        if (isScrolling && scrollFrameCount > 0) {
          const measuredFPS = Math.round((scrollFrameCount * 1000) / (currentTime - lastScrollFPSUpdate));
          setMetrics((prev) => ({ ...prev, scrollFPS: Math.min(measuredFPS, 60) }));
        }
        scrollFrameCount = 0;
        lastScrollFPSUpdate = currentTime;
      }
      animationFrameId = requestAnimationFrame(measureScrollPerformance);
    };

    animationFrameId = requestAnimationFrame(measureScrollPerformance);

    const handleScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        scrollFrameCount = 0;
        setMetrics((prev) => ({ ...prev, scrollFPS: 60 }));
      }, 150);
    };

    editorContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      editorContainer.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(scrollTimeout);
    };
  }, [hasGenerated, useVirtualization]);

  useEffect(() => {
    const countNodes = () => {
      const editorContainer = document.querySelector('[data-editor-scroll-container]');
      if (!editorContainer) return 0;
      const allElements = editorContainer.querySelectorAll('*');
      return allElements.length;
    };

    const interval = setInterval(() => {
      const nodes = countNodes();
      setMetrics((prev) => ({ ...prev, domNodes: nodes }));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasGenerated, useVirtualization]);

  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        setMetrics((prev) => ({ ...prev, memoryUsage: Math.round(usedMB) }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAutoScrolling || !hasGenerated) {
      if (autoScrollIntervalRef.current) {
        cancelAnimationFrame(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const editorContainer = document.querySelector('[data-editor-scroll-container]') as HTMLElement;
    if (!editorContainer) return;

    let direction: 'down' | 'up' = 'down';
    let currentScroll = editorContainer.scrollTop;
    const scrollSpeed = 3;

    const autoScroll = () => {
      if (!isAutoScrolling) return;
      const container = document.querySelector('[data-editor-scroll-container]') as HTMLElement;
      if (!container) return;

      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (direction === 'down') {
        currentScroll += scrollSpeed;
        if (currentScroll >= maxScroll) {
          currentScroll = maxScroll;
          direction = 'up';
        }
      } else {
        currentScroll -= scrollSpeed;
        if (currentScroll <= 0) {
          currentScroll = 0;
          direction = 'down';
        }
      }

      container.scrollTop = currentScroll;
      autoScrollIntervalRef.current = requestAnimationFrame(autoScroll);
    };

    autoScrollIntervalRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (autoScrollIntervalRef.current) {
        cancelAnimationFrame(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isAutoScrolling, hasGenerated]);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrolling((prev) => !prev);
  }, []);

  const getPerformanceStatus = () => {
    if (metrics.scrollFPS >= 55 && metrics.fps >= 55) return 'excellent';
    if (metrics.scrollFPS >= 30 && metrics.fps >= 30) return 'good';
    return 'poor';
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="flex h-full">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Gauge size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Performance Lab</h2>
              <p className="text-xs text-blue-100">Stress test your editor</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Layers size={16} className="text-blue-600" />
              Block Count
            </label>
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={blockCount}
              onChange={(e) => setBlockCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-2">
              <input
                type="number"
                min="100"
                max="20000"
                step="100"
                value={blockCount}
                onChange={(e) => setBlockCount(parseInt(e.target.value) || 1000)}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 self-center">Max: 20,000</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Zap size={16} className="text-purple-600" />
                Virtualization
              </label>
              <button
                onClick={() => setUseVirtualization(!useVirtualization)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useVirtualization ? 'bg-purple-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useVirtualization ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className={`text-xs ${useVirtualization ? 'text-purple-600' : 'text-gray-500'}`}>
              {useVirtualization ? '✓ Only visible blocks are rendered' : 'All blocks rendered in DOM'}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => generateBlocks(blockCount)}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-600/30"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Generate {blockCount.toLocaleString()} Blocks
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={toggleAutoScroll}
                disabled={!hasGenerated}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-medium ${isAutoScrolling ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
              >
                {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />}
                {isAutoScrolling ? 'Stop' : 'Auto Scroll'}
              </button>
              <button
                onClick={clearEditor}
                disabled={!hasGenerated}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Activity size={16} className="text-green-600" />
              Live Metrics
            </h3>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Render FPS</span>
                  <span className={`text-lg font-bold ${metrics.fps >= 55 ? 'text-green-600' : metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metrics.fps}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${metrics.fps >= 55 ? 'bg-green-500' : metrics.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Scroll FPS</span>
                  <span className={`text-lg font-bold ${metrics.scrollFPS >= 55 ? 'text-green-600' : metrics.scrollFPS >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metrics.scrollFPS}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${metrics.scrollFPS >= 55 ? 'bg-green-500' : metrics.scrollFPS >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min((metrics.scrollFPS / 60) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{metrics.domNodes.toLocaleString()}</div>
                  <div className="text-xs text-blue-600">DOM Nodes</div>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-orange-700">{metrics.memoryUsage}</div>
                  <div className="text-xs text-orange-600">Memory (MB)</div>
                </div>
              </div>

              {hasGenerated && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-600">Generation Time</span>
                    <span className="text-lg font-bold text-purple-700">{metrics.renderTime.toFixed(0)}ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasGenerated && (
            <div className={`rounded-lg p-4 ${performanceStatus === 'excellent' ? 'bg-green-50 border border-green-200' : performanceStatus === 'good' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {performanceStatus === 'excellent' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : performanceStatus === 'good' ? (
                  <AlertTriangle size={18} className="text-yellow-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
                <span className={`font-semibold ${performanceStatus === 'excellent' ? 'text-green-700' : performanceStatus === 'good' ? 'text-yellow-700' : 'text-red-700'}`}>
                  {performanceStatus === 'excellent' ? 'Excellent Performance' : performanceStatus === 'good' ? 'Good Performance' : 'Poor Performance'}
                </span>
              </div>
              <p className={`text-xs ${performanceStatus === 'excellent' ? 'text-green-600' : performanceStatus === 'good' ? 'text-yellow-600' : 'text-red-600'}`}>
                {performanceStatus === 'poor' && !useVirtualization ? 'Enable virtualization for better performance' : performanceStatus === 'excellent' ? 'Editor is running smoothly' : 'Consider reducing block count'}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            💡 Try 10,000+ blocks without virtualization to see the difference!
          </p>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 overflow-hidden" ref={containerRef}>
        <div className="h-full p-6">
          <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
            <EditorBlock
              showPreview={false}
              showToolbar={false}
              externalContent={content}
              onContentChange={updateContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
