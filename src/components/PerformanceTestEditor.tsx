import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, Zap, MemoryStick, Layers, Play, Pause } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { VirtualizedEditor } from './VirtualizedEditor';
import { useLoroEditor } from '../hooks/useLoroEditor';

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

  const { updateContent } = useLoroEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<number[]>([]);
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Generate test content
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
        htmlContent += `<h1>Heading 1 - Block ${i + 1}</h1>`;
      } else if (type === 1) {
        htmlContent += `<h2>Heading 2 - Block ${i + 1}</h2>`;
      } else if (type === 2) {
        htmlContent += `<h3>Heading 3 - Block ${i + 1}</h3>`;
      } else if (type === 3) {
        htmlContent += `<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>`;
      } else if (type === 4) {
        htmlContent += `<ol><li>Numbered item 1</li><li>Numbered item 2</li></ol>`;
      } else if (type === 5) {
        htmlContent += `<blockquote>${paragraphTypes[i % paragraphTypes.length]}</blockquote>`;
      } else if (type === 6) {
        htmlContent += `<pre><code>const example = "code block ${i + 1}";</code></pre>`;
      } else {
        htmlContent += `<p><strong>Block ${i + 1}:</strong> ${paragraphTypes[i % paragraphTypes.length]}</p>`;
      }
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Update the editor content
    updateContent(htmlContent);
    setMetrics((prev) => ({ ...prev, renderTime }));
    setHasGenerated(true);
    setIsGenerating(false);
  }, [updateContent]);

  // Measure FPS
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
        if (fpsRef.current.length > 10) {
          fpsRef.current.shift();
        }

        const avgFPS = Math.round(fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length);

        setMetrics((prev) => ({
          ...prev,
          fps: avgFPS,
        }));

        frames = 0;
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(measureFPS);
    };

    frameId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(frameId);
  }, []);

  // Measure scroll FPS
  useEffect(() => {
    const editorContainer = document.querySelector('[contenteditable]')?.parentElement;
    if (!editorContainer) return;

    let scrollFrameCount = 0;
    let lastScrollFPSUpdate = performance.now();
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;
    let animationFrameId: number;

    const measureScrollPerformance = () => {
      const currentTime = performance.now();

      if (isScrolling) {
        scrollFrameCount++;
      }

      if (currentTime >= lastScrollFPSUpdate + 1000) {
        if (isScrolling && scrollFrameCount > 0) {
          const measuredFPS = Math.round((scrollFrameCount * 1000) / (currentTime - lastScrollFPSUpdate));
          setMetrics((prev) => ({
            ...prev,
            scrollFPS: Math.min(measuredFPS, 60),
          }));
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
        setMetrics((prev) => ({
          ...prev,
          scrollFPS: 60,
        }));
      }, 150);
    };

    editorContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      editorContainer.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(scrollTimeout);
    };
  }, [hasGenerated, useVirtualization]);

  // Count DOM nodes
  useEffect(() => {
    const countNodes = () => {
      const editorContainer = document.querySelector('[contenteditable]')?.parentElement;
      if (!editorContainer) return 0;

      const walker = document.createTreeWalker(
        editorContainer,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      let count = 0;
      while (walker.nextNode()) {
        count++;
      }
      return count;
    };

    const interval = setInterval(() => {
      const nodes = countNodes();
      setMetrics((prev) => ({ ...prev, domNodes: nodes }));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasGenerated, useVirtualization]);

  // Estimate memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        setMetrics((prev) => ({ ...prev, memoryUsage: Math.round(usedMB) }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || !hasGenerated) {
      if (autoScrollIntervalRef.current) {
        cancelAnimationFrame(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const editorContainer = document.querySelector('[contenteditable]')?.parentElement;
    if (!editorContainer) return;

    const scrollHeight = editorContainer.scrollHeight;
    const clientHeight = editorContainer.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    let direction: 'down' | 'up' = 'down';
    let currentScroll = editorContainer.scrollTop;
    const scrollSpeed = 2;

    const autoScroll = () => {
      if (!isAutoScrolling) return;

      const container = document.querySelector('[contenteditable]')?.parentElement;
      if (!container) return;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={32} />
                Performance Testing Lab
              </h1>
              <p className="text-gray-600 mt-1">
                Test real editor performance with up to 20,000 blocks
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Blocks
              </label>
              <input
                type="number"
                min="100"
                max="20000"
                step="100"
                value={blockCount}
                onChange={(e) => setBlockCount(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">100 - 20,000 blocks</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mode
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useVirtualization}
                    onChange={(e) => setUseVirtualization(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Virtualization
                  </span>
                </label>
              </div>
              {useVirtualization ? (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Zap size={12} /> Virtualized Mode
                </p>
              ) : (
                <p className="text-xs text-orange-600 mt-1">⚠️ Standard Mode</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Generate
              </label>
              <button
                onClick={() => generateBlocks(blockCount)}
                disabled={isGenerating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : `Generate Blocks`}
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Auto Scroll
              </label>
              <button
                onClick={toggleAutoScroll}
                disabled={!hasGenerated}
                className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                  isAutoScrolling
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isAutoScrolling ? (
                  <>
                    <Pause size={16} />
                    Stop Scroll
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start Scroll
                  </>
                )}
              </button>
              {hasGenerated && (
                <p className="text-xs text-gray-500 mt-1">
                  {isAutoScrolling ? '🔄 Auto-scrolling' : 'Click to start'}
                </p>
              )}
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Layers size={16} />
                <span className="text-xs font-semibold">DOM Nodes</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{metrics.domNodes}</div>
              <div className="text-xs text-blue-600 mt-1">
                {hasGenerated && `of ${blockCount} blocks`}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Activity size={16} />
                <span className="text-xs font-semibold">Render FPS</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{metrics.fps}</div>
              <div className="text-xs text-green-600 mt-1">
                {metrics.fps >= 55 ? '✓ Smooth' : metrics.fps >= 30 ? '⚠️ Fair' : '❌ Laggy'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Activity size={16} />
                <span className="text-xs font-semibold">Scroll FPS</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{metrics.scrollFPS}</div>
              <div className="text-xs text-purple-600 mt-1">
                {metrics.scrollFPS >= 55 ? '✓ Smooth' : metrics.scrollFPS >= 30 ? '⚠️ Fair' : '❌ Laggy'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <MemoryStick size={16} />
                <span className="text-xs font-semibold">Memory</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{metrics.memoryUsage}</div>
              <div className="text-xs text-orange-600 mt-1">MB used</div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
              <div className="flex items-center gap-2 text-pink-700 mb-1">
                <Zap size={16} />
                <span className="text-xs font-semibold">Gen Time</span>
              </div>
              <div className="text-2xl font-bold text-pink-900">{metrics.renderTime.toFixed(0)}</div>
              <div className="text-xs text-pink-600 mt-1">ms</div>
            </div>
          </div>

          {/* Performance Analysis */}
          {hasGenerated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Performance Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-800">
                    <strong>Rendering Strategy:</strong>{' '}
                    {useVirtualization ? (
                      <span className="text-green-600">✓ Virtual (Only visible blocks)</span>
                    ) : (
                      <span className="text-orange-600">⚠️ Standard (All blocks)</span>
                    )}
                  </p>
                  <p className="text-blue-800 mt-1">
                    <strong>Editor:</strong>{' '}
                    {useVirtualization ? 'VirtualizedEditor' : 'RichTextEditor'}
                  </p>
                </div>
                <div>
                  <p className="text-blue-800">
                    <strong>Performance:</strong>{' '}
                    {metrics.scrollFPS >= 55 && metrics.fps >= 55 ? (
                      <span className="text-green-600">✓ Excellent</span>
                    ) : metrics.scrollFPS >= 30 && metrics.fps >= 30 ? (
                      <span className="text-yellow-600">⚠️ Good</span>
                    ) : (
                      <span className="text-red-600">❌ Poor (Enable virtualization!)</span>
                    )}
                  </p>
                  <p className="text-blue-800 mt-1">
                    <strong>Recommendation:</strong>{' '}
                    {!useVirtualization && blockCount > 500 ? (
                      <span className="text-orange-600">Enable virtualization for better performance</span>
                    ) : useVirtualization ? (
                      <span className="text-green-600">Optimal configuration</span>
                    ) : (
                      <span className="text-gray-600">Performance is acceptable</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real Editor Component */}
        <div ref={containerRef}>
          {useVirtualization ? <VirtualizedEditor /> : <RichTextEditor />}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            💡 <strong>Tip:</strong> Generate 10,000+ blocks in standard mode, then enable virtualization to see the real performance difference!
          </p>
        </div>
      </div>
    </div>
  );
};
