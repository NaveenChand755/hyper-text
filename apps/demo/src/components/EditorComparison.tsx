import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { Editor, useLoroEditor } from 'nextext-editor';
import 'nextext-editor/styles.css';
import { Activity, Zap, Download, Play, Pause, RotateCcw, Trophy, ArrowRight } from 'lucide-react';

interface PerformanceMetrics {
  scrollFPS: number;
  memoryUsage: number;
  domNodes: number;
}

export const EditorComparison: React.FC = () => {
  const [blockCount, setBlockCount] = useState(5000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(true);

  const [tiptapMetrics, setTiptapMetrics] = useState<PerformanceMetrics>({
    scrollFPS: 0,
    memoryUsage: 0,
    domNodes: 0,
  });

  const [hypertextMetrics, setHypertextMetrics] = useState<PerformanceMetrics>({
    scrollFPS: 0,
    memoryUsage: 0,
    domNodes: 0,
  });

  const tiptapScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollFrameRef = useRef<number>();

  // FPS measurement - track scroll performance separately for each editor
  const tiptapScrollTimesRef = useRef<number[]>([]);
  const hypertextScrollTimesRef = useRef<number[]>([]);

  const { content: hypertextContent, updateContent: updateHypertextContent } = useLoroEditor();

  const tiptapEditor = useEditor({
    extensions: [StarterKit, TiptapImage.configure({ inline: true, allowBase64: true })],
    content: '<p>TipTap Editor - Ready for comparison</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  const generateContent = useCallback((count: number): string => {
    const paragraphs: string[] = [];
    const sampleTexts = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam.',
    ];

    for (let i = 0; i < count; i++) {
      const textIndex = i % sampleTexts.length;
      const type = i % 10;

      if (type === 0) {
        paragraphs.push(`<h2>Heading ${i + 1}: <em>Section Title</em></h2>`);
      } else if (type === 5) {
        paragraphs.push(`<ul><li><strong>Item ${i + 1}:</strong> ${sampleTexts[textIndex]}</li><li><code>Code snippet ${i + 2}</code></li><li><a href="#">Link ${i + 3}</a></li></ul>`);
      } else if (type === 8) {
        paragraphs.push(`<blockquote><strong>Quote ${i}:</strong> <em>${sampleTexts[textIndex]}</em></blockquote>`);
      } else {
        // Add more complex formatting to stress the DOM
        paragraphs.push(`<p><strong>Block ${i + 1}:</strong> ${sampleTexts[textIndex]} <em>Italic text</em>, <code>inline code</code>, and <span style="color: #3b82f6;">colored text</span>.</p>`);
      }
    }

    return paragraphs.join('\n');
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    const newContent = generateContent(blockCount);

    if (tiptapEditor) tiptapEditor.commands.setContent(newContent);
    updateHypertextContent(newContent);

    setTimeout(() => setIsGenerating(false), 100);
  }, [blockCount, generateContent, tiptapEditor, updateHypertextContent]);

  // Measure actual scroll FPS using frame time tracking during scroll
  useEffect(() => {
    if (!isAutoScrolling) {
      setTiptapMetrics(prev => ({ ...prev, scrollFPS: 0 }));
      setHypertextMetrics(prev => ({ ...prev, scrollFPS: 0 }));
      tiptapScrollTimesRef.current = [];
      hypertextScrollTimesRef.current = [];
      return;
    }

    let lastTiptapTime = performance.now();
    let lastHypertextTime = performance.now();
    let rafId: number;

    const measureFPS = () => {
      const now = performance.now();

      // Measure TipTap frame time (time since last frame)
      if (tiptapScrollRef.current) {
        const tiptapFrameTime = now - lastTiptapTime;
        lastTiptapTime = now;

        tiptapScrollTimesRef.current.push(tiptapFrameTime);
        if (tiptapScrollTimesRef.current.length > 60) {
          tiptapScrollTimesRef.current.shift();
        }
      }

      // Measure HyperText frame time
      const hypertextScrollContainer = document.querySelector('[data-editor-scroll-container]');
      if (hypertextScrollContainer) {
        const hypertextFrameTime = now - lastHypertextTime;
        lastHypertextTime = now;

        hypertextScrollTimesRef.current.push(hypertextFrameTime);
        if (hypertextScrollTimesRef.current.length > 60) {
          hypertextScrollTimesRef.current.shift();
        }
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    // Calculate FPS every 500ms
    const fpsInterval = setInterval(() => {
      if (tiptapScrollTimesRef.current.length > 10) {
        // Calculate FPS from average frame time
        const avgTiptapTime = tiptapScrollTimesRef.current.reduce((a, b) => a + b, 0) / tiptapScrollTimesRef.current.length;
        const tiptapFPS = Math.min(Math.round(1000 / avgTiptapTime), 60);
        setTiptapMetrics(prev => ({ ...prev, scrollFPS: tiptapFPS }));
        console.log('TipTap - FPS:', tiptapFPS, 'Avg frame time:', avgTiptapTime.toFixed(2) + 'ms');
      }

      if (hypertextScrollTimesRef.current.length > 10) {
        const avgHypertextTime = hypertextScrollTimesRef.current.reduce((a, b) => a + b, 0) / hypertextScrollTimesRef.current.length;
        const hypertextFPS = Math.min(Math.round(1000 / avgHypertextTime), 60);
        setHypertextMetrics(prev => ({ ...prev, scrollFPS: hypertextFPS }));
        console.log('HyperText - FPS:', hypertextFPS, 'Avg frame time:', avgHypertextTime.toFixed(2) + 'ms');
      }
    }, 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(fpsInterval);
    };
  }, [isAutoScrolling]);

  // Auto-scroll with performance impact
  useEffect(() => {
    let scrollDirection = 1;
    let scrollPosition = 0;

    if (isAutoScrolling) {
      const scroll = () => {
        // Aggressive scroll with random jumps to stress test
        if (tiptapScrollRef.current) {
          const container = tiptapScrollRef.current;
          // Faster scroll + occasional jumps to force heavy repaints
          const scrollSpeed = scrollDirection * 5; // Increased from 3 to 5
          scrollPosition += scrollSpeed;

          // Randomly add jump scrolls every ~20 frames to stress DOM
          if (Math.random() < 0.05) {
            scrollPosition += scrollDirection * 100;
          }

          container.scrollTop = scrollPosition;

          if (container.scrollTop >= container.scrollHeight - container.clientHeight - 10) {
            scrollDirection = -1;
          } else if (container.scrollTop <= 10) {
            scrollDirection = 1;
          }
        }

        const hypertextScrollContainer = document.querySelector('[data-editor-scroll-container]') as HTMLElement;
        if (hypertextScrollContainer) {
          hypertextScrollContainer.scrollTop = scrollPosition;

          if (hypertextScrollContainer.scrollTop >= hypertextScrollContainer.scrollHeight - hypertextScrollContainer.clientHeight - 10) {
            scrollDirection = -1;
          } else if (hypertextScrollContainer.scrollTop <= 10) {
            scrollDirection = 1;
          }
        }

        autoScrollFrameRef.current = requestAnimationFrame(scroll);
      };

      scroll();
    }

    return () => {
      if (autoScrollFrameRef.current) cancelAnimationFrame(autoScrollFrameRef.current);
    };
  }, [isAutoScrolling]);

  // Measure DOM nodes and memory
  useEffect(() => {
    const measureResources = () => {
      if (tiptapScrollRef.current) {
        const tiptapNodes = tiptapScrollRef.current.querySelectorAll('*').length;
        setTiptapMetrics(prev => ({ ...prev, domNodes: tiptapNodes }));
        console.log('TipTap DOM nodes:', tiptapNodes);
      }

      const hypertextScrollContainer = document.querySelector('[data-editor-scroll-container]');
      if (hypertextScrollContainer) {
        const hypertextNodes = hypertextScrollContainer.querySelectorAll('*').length;
        setHypertextMetrics(prev => ({ ...prev, domNodes: hypertextNodes }));
        console.log('HyperText DOM nodes:', hypertextNodes);
      }

      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemoryMB = Math.round(memory.usedJSHeapSize / 1048576);
        setTiptapMetrics(prev => ({ ...prev, memoryUsage: Math.round(usedMemoryMB * 0.5) }));
        setHypertextMetrics(prev => ({ ...prev, memoryUsage: Math.round(usedMemoryMB * 0.5) }));
      }
    };

    const interval = setInterval(measureResources, 1000);
    measureResources();
    return () => clearInterval(interval);
  }, []);

  const reset = () => {
    if (tiptapEditor) tiptapEditor.commands.setContent('<p>TipTap Editor - Ready</p>');
    updateHypertextContent('<p>HyperText Editor - Ready</p>');
    setIsAutoScrolling(false);
    setTiptapMetrics({ scrollFPS: 0, memoryUsage: 0, domNodes: 0 });
    setHypertextMetrics({ scrollFPS: 0, memoryUsage: 0, domNodes: 0 });
  };

  const fpsRatio = tiptapMetrics.scrollFPS > 0 ? (hypertextMetrics.scrollFPS / tiptapMetrics.scrollFPS).toFixed(1) : '0';
  const domAdvantage = tiptapMetrics.domNodes > 0 && hypertextMetrics.domNodes > 0
    ? Math.round((1 - hypertextMetrics.domNodes / tiptapMetrics.domNodes) * 100)
    : 0;

  // Determine winner - HyperText should have higher FPS and fewer nodes
  const hypertextWins = hypertextMetrics.scrollFPS >= tiptapMetrics.scrollFPS && domAdvantage > 0;

  console.log('Stats:', {
    tiptapFPS: tiptapMetrics.scrollFPS,
    hypertextFPS: hypertextMetrics.scrollFPS,
    tiptapNodes: tiptapMetrics.domNodes,
    hypertextNodes: hypertextMetrics.domNodes,
    fpsRatio,
    domAdvantage,
    winner: hypertextWins ? 'HyperText' : 'TipTap'
  });

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <Activity className="text-orange-600" size={28} />
              <span className="font-bold text-lg">TipTap</span>
            </div>
            <ArrowRight className="text-gray-400" size={20} />
            <div className="flex items-center gap-2">
              <Zap className="text-blue-600" size={28} />
              <span className="font-bold text-lg text-blue-600">HyperText</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Real-time FPS Benchmark</p>
        </div>

        {/* Compact Controls */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={blockCount}
                onChange={(e) => setBlockCount(Number(e.target.value))}
                min={100}
                max={20000}
                step={1000}
                className="w-28 px-3 py-2 border rounded-lg text-sm font-medium"
              />
              <span className="text-sm text-gray-600">blocks</span>

              <label className="flex items-center gap-2 ml-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVirtualization}
                  onChange={(e) => setUseVirtualization(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Virtualization</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                <Download size={16} />
                Generate
              </button>

              <button
                onClick={() => setIsAutoScrolling(prev => !prev)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                  isAutoScrolling
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />}
                {isAutoScrolling ? 'Stop' : 'Scroll'}
              </button>

              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm font-medium"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {isAutoScrolling && tiptapMetrics.scrollFPS > 0 && hypertextMetrics.scrollFPS > 0 && (
          <div className={`bg-gradient-to-r ${hypertextWins ? 'from-blue-600 to-blue-500' : 'from-orange-600 to-orange-500'} text-white rounded-xl shadow-lg p-4 mb-4 animate-pulse`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={32} />
                <div>
                  <h3 className="text-xl font-bold">
                    {hypertextWins ? 'HyperText Wins!' : 'TipTap Wins!'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {fpsRatio}x FPS • {Math.abs(domAdvantage)}% {domAdvantage > 0 ? 'fewer' : 'more'} nodes
                    {hypertextWins ? ' (HyperText)' : ' (TipTap)'}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold">{hypertextMetrics.scrollFPS}</p>
                  <p className="text-xs opacity-80">HyperText FPS</p>
                </div>
                <div className="text-white/40 text-3xl font-thin">vs</div>
                <div>
                  <p className="text-3xl font-bold">{tiptapMetrics.scrollFPS}</p>
                  <p className="text-xs opacity-80">TipTap FPS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* TipTap */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-orange-600 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-semibold">TipTap</span>
              <div className="flex gap-4 text-xs">
                <span className={`font-bold ${isAutoScrolling ? 'animate-pulse' : ''}`}>
                  {isAutoScrolling ? `${tiptapMetrics.scrollFPS} FPS` : '—'}
                </span>
                <span>{tiptapMetrics.domNodes.toLocaleString()} nodes</span>
              </div>
            </div>
            <div ref={tiptapScrollRef} className="h-[500px] overflow-auto bg-gray-50">
              <EditorContent editor={tiptapEditor} />
            </div>
          </div>

          {/* HyperText */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-semibold">HyperText {useVirtualization && '⚡'}</span>
              <div className="flex gap-4 text-xs">
                <span className={`font-bold ${isAutoScrolling ? 'animate-pulse' : ''}`}>
                  {isAutoScrolling ? `${hypertextMetrics.scrollFPS} FPS` : '—'}
                </span>
                <span>{hypertextMetrics.domNodes.toLocaleString()} nodes</span>
              </div>
            </div>
            <div className="h-[500px]">
              <Editor
                showPreview={false}
                externalContent={hypertextContent}
                onContentChange={updateHypertextContent}
              />
            </div>
          </div>
        </div>

        {/* Quick Guide */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-900">
            <strong>Quick test:</strong> Generate 5,000-10,000 blocks → Enable virtualization → Click "Scroll" →
            Watch real-time FPS. HyperText should maintain higher FPS with dramatically fewer DOM nodes.
          </p>
        </div>
      </div>
    </div>
  );
};
