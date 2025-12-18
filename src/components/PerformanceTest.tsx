import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Activity, Zap, MemoryStick, Layers, Play, Pause } from 'lucide-react';

interface PerformanceMetrics {
  domNodes: number;
  fps: number;
  memoryUsage: number;
  renderTime: number;
  scrollFPS: number;
}

interface Block {
  id: string;
  content: string;
}

export const PerformanceTest: React.FC = () => {
  const [blockCount, setBlockCount] = useState(1000);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    domNodes: 0,
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    scrollFPS: 60,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<number[]>([]);
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Setup virtualizer (only used when useVirtualization is true)
  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Generate test blocks
  const generateBlocks = useCallback((count: number) => {
    setIsGenerating(true);
    const startTime = performance.now();

    const newBlocks: Block[] = [];
    const paragraphTypes = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
    ];

    for (let i = 0; i < count; i++) {
      const type = i % 10;
      let content = '';

      if (type === 0) {
        content = `<h1>Heading 1 - Block ${i + 1}</h1>`;
      } else if (type === 1) {
        content = `<h2>Heading 2 - Block ${i + 1}</h2>`;
      } else if (type === 2) {
        content = `<h3>Heading 3 - Block ${i + 1}</h3>`;
      } else if (type === 3) {
        content = `<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>`;
      } else if (type === 4) {
        content = `<ol><li>Numbered item 1</li><li>Numbered item 2</li></ol>`;
      } else if (type === 5) {
        content = `<blockquote>${paragraphTypes[i % paragraphTypes.length]}</blockquote>`;
      } else if (type === 6) {
        content = `<pre><code>const example = "code block ${i + 1}";</code></pre>`;
      } else {
        content = `<p><strong>Block ${i + 1}:</strong> ${paragraphTypes[i % paragraphTypes.length]}</p>`;
      }

      newBlocks.push({
        id: `block-${i}`,
        content,
      });
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    setBlocks(newBlocks);
    setMetrics((prev) => ({ ...prev, renderTime }));
    setIsGenerating(false);
  }, []);

  // Measure FPS
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      frames++;

      // Update FPS every 1 second
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

  // Measure scroll FPS - uses requestAnimationFrame to track actual rendering performance
  useEffect(() => {
    if (!containerRef.current) return;

    let scrollFrameCount = 0;
    let lastScrollFPSUpdate = performance.now();
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;
    let animationFrameId: number;

    // This runs at display refresh rate (60 FPS) and counts frames while scrolling
    const measureScrollPerformance = () => {
      if (!containerRef.current) return;

      const currentTime = performance.now();

      // Count this frame if we're scrolling
      if (isScrolling) {
        scrollFrameCount++;
      }

      // Update scroll FPS metric every second
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

    // Start measuring loop
    animationFrameId = requestAnimationFrame(measureScrollPerformance);

    const handleScroll = () => {
      isScrolling = true;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        scrollFrameCount = 0;
        // Show "idle" state
        setMetrics((prev) => ({
          ...prev,
          scrollFPS: 60,
        }));
      }, 150);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(scrollTimeout);
    };
  }, [blocks.length]);

  // Count DOM nodes
  useEffect(() => {
    const countNodes = () => {
      if (!containerRef.current) return 0;

      const walker = document.createTreeWalker(
        containerRef.current,
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
  }, [blocks, useVirtualization]);

  // Estimate memory usage
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      setMetrics((prev) => ({ ...prev, memoryUsage: Math.round(usedMB) }));
    }
  }, [blocks]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || !containerRef.current || blocks.length === 0) {
      if (autoScrollIntervalRef.current) {
        cancelAnimationFrame(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    let direction: 'down' | 'up' = 'down';
    let currentScroll = container.scrollTop;
    const scrollSpeed = 2; // pixels per frame

    const autoScroll = () => {
      if (!isAutoScrolling || !containerRef.current) return;

      // Scroll down
      if (direction === 'down') {
        currentScroll += scrollSpeed;
        if (currentScroll >= maxScroll) {
          currentScroll = maxScroll;
          direction = 'up'; // Reverse direction
        }
      }
      // Scroll up
      else {
        currentScroll -= scrollSpeed;
        if (currentScroll <= 0) {
          currentScroll = 0;
          direction = 'down'; // Reverse direction
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
  }, [isAutoScrolling, blocks.length]);

  // Toggle auto-scroll
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
                Test virtual scrolling with up to 20,000 blocks
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
                disabled={blocks.length === 0}
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
              {blocks.length > 0 && (
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
                {blocks.length > 0 && `of ${blocks.length} blocks`}
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
          {blocks.length > 0 && (
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
                    <strong>Efficiency:</strong>{' '}
                    {useVirtualization
                      ? `Rendering ${Math.round((metrics.domNodes / blocks.length) * 100)}% of blocks`
                      : 'Rendering 100% of blocks'}
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
                    {!useVirtualization && blocks.length > 500 ? (
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

        {/* Editor Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-700">
              Test Editor - {blocks.length} Blocks {useVirtualization && '(Virtualized)'}
            </h2>
          </div>

          <div
            ref={containerRef}
            className="h-[600px] overflow-auto bg-gray-50"
          >
            {blocks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 p-4">
                <div className="text-center">
                  <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No blocks generated yet</p>
                  <p className="text-sm">Set block count and click "Generate Blocks"</p>
                </div>
              </div>
            ) : useVirtualization ? (
              // Virtualized rendering
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const block = blocks[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="px-4 py-2"
                    >
                      <div
                        className="bg-white rounded-md p-4 shadow-sm border border-gray-200"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              // Standard rendering
              <div className="space-y-3 p-4">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-white rounded-md p-4 shadow-sm border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            💡 <strong>Tip:</strong> Try generating 10,000+ blocks without virtualization, then enable it to see the difference!
          </p>
        </div>
      </div>
    </div>
  );
};
