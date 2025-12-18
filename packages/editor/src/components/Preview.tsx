import React, { memo, useMemo } from 'react';
import { PreviewMode } from '../types/editor';
import { Eye, Code2, FileText, FileJson } from 'lucide-react';

interface PreviewProps {
  content: string;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}

const PreviewComponent: React.FC<PreviewProps> = ({ content, mode, onModeChange }) => {
  // Convert HTML to plain text
  const textContent = useMemo(() => {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.textContent || '';
  }, [content]);

  // Convert HTML to JSON representation
  const jsonContent = useMemo(() => {
    const div = document.createElement('div');
    div.innerHTML = content;

    const parseNode = (node: Node): unknown => {
      if (node.nodeType === Node.TEXT_NODE) {
        return { type: 'text', content: node.textContent };
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const children = Array.from(element.childNodes).map(parseNode);

        return {
          type: 'element',
          tag: element.tagName.toLowerCase(),
          attributes: Array.from(element.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>),
          children: children.length > 0 ? children : undefined,
        };
      }

      return null;
    };

    const nodes = Array.from(div.childNodes).map(parseNode).filter(Boolean);
    return JSON.stringify(nodes, null, 2);
  }, [content]);

  const previewContent = useMemo(() => {
    switch (mode) {
      case 'html':
        return content;
      case 'text':
        return textContent;
      case 'json':
        return jsonContent;
      default:
        return content;
    }
  }, [mode, content, textContent, jsonContent]);

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200 mt-8">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <Eye size={18} className="text-gray-600" />
        <span className="font-semibold text-gray-700">Preview</span>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onModeChange('html')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all ${
              mode === 'html'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Code2 size={14} />
            HTML
          </button>

          <button
            onClick={() => onModeChange('text')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all ${
              mode === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <FileText size={14} />
            Text
          </button>

          <button
            onClick={() => onModeChange('json')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all ${
              mode === 'json'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <FileJson size={14} />
            JSON
          </button>
        </div>
      </div>

      <div className="p-4">
        <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {previewContent}
        </pre>
      </div>
    </div>
  );
};

export const Preview = memo(PreviewComponent);
