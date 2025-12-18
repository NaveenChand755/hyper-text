import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Toolbar } from './Toolbar';
import { Preview } from './Preview';
import { useLoroEditor } from '../hooks/useLoroEditor';
import { ToolbarAction, TextFormat, PreviewMode } from '../types/editor';
import { Store } from '@tanstack/react-store';

interface EditorSelection {
  start: number;
  end: number;
}

// Create a store for editor state management
const editorStore = new Store<{
  format: TextFormat;
  selection: EditorSelection;
}>({
  format: {},
  selection: { start: 0, end: 0 },
});

// Split content into virtual blocks for better performance
interface EditorBlock {
  id: string;
  content: string;
  type: 'text' | 'heading' | 'list' | 'code' | 'blockquote';
}

const parseContentIntoBlocks = (html: string): EditorBlock[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: EditorBlock[] = [];
  let blockId = 0;

  const processNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        blocks.push({
          id: `block-${blockId++}`,
          content: element.outerHTML,
          type: 'heading',
        });
      } else if (['ul', 'ol'].includes(tagName)) {
        blocks.push({
          id: `block-${blockId++}`,
          content: element.outerHTML,
          type: 'list',
        });
      } else if (tagName === 'pre') {
        blocks.push({
          id: `block-${blockId++}`,
          content: element.outerHTML,
          type: 'code',
        });
      } else if (tagName === 'blockquote') {
        blocks.push({
          id: `block-${blockId++}`,
          content: element.outerHTML,
          type: 'blockquote',
        });
      } else if (tagName === 'p' || tagName === 'div') {
        blocks.push({
          id: `block-${blockId++}`,
          content: element.outerHTML || element.textContent || '',
          type: 'text',
        });
      } else {
        // Process children
        Array.from(element.childNodes).forEach(processNode);
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push({
        id: `block-${blockId++}`,
        content: `<p>${node.textContent}</p>`,
        type: 'text',
      });
    }
  };

  Array.from(doc.body.childNodes).forEach(processNode);

  // If no blocks found, add a default empty block
  if (blocks.length === 0) {
    blocks.push({
      id: 'block-0',
      content: '<p><br/></p>',
      type: 'text',
    });
  }

  return blocks;
};

export const VirtualizedEditor: React.FC = () => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [selection, setSelection] = useState<EditorSelection>({ start: 0, end: 0 });
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('html');
  const [useVirtualization, setUseVirtualization] = useState(false); // Toggle for testing

  const { content, updateContent } = useLoroEditor();

  // Parse content into blocks for virtualization
  const blocks = useMemo(() => {
    if (!useVirtualization || !content) return [];
    return parseContentIntoBlocks(content);
  }, [content, useVirtualization]);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => editorContainerRef.current,
    estimateSize: () => 50, // Estimated height per block
    overscan: 5, // Render 5 items above and below viewport
    enabled: useVirtualization,
  });

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current || sel.rangeCount === 0) return null;

    try {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const caretOffset = preCaretRange.toString().length;

      return caretOffset;
    } catch (error) {
      return null;
    }
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((position: number) => {
    if (!editorRef.current) return;

    const sel = window.getSelection();
    if (!sel) return;

    const createRange = (node: Node, chars: { count: number }): Range | null => {
      if (chars.count === 0) {
        const range = document.createRange();
        range.setStart(node, 0);
        range.setEnd(node, 0);
        return range;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        if (textNode.length >= chars.count) {
          const range = document.createRange();
          range.setStart(node, chars.count);
          range.setEnd(node, chars.count);
          return range;
        } else {
          chars.count -= textNode.length;
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          const range = createRange(node.childNodes[i], chars);
          if (range) return range;
        }
      }

      return null;
    };

    const range = createRange(editorRef.current, { count: position });
    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  // Update editor content from Loro
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return;

    const cursorPos = saveCursorPosition();

    // Use innerHTML to preserve formatting
    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;

      if (cursorPos !== null) {
        restoreCursorPosition(cursorPos);
      }
    }
  }, [content, saveCursorPosition, restoreCursorPosition]);

  useEffect(() => {
    editorStore.setState((state) => ({
      ...state,
      format: currentFormat,
      selection,
    }));
  }, [currentFormat, selection]);

  const handleToolbarAction = useCallback((action: ToolbarAction, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

    // Execute the command
    switch (action) {
      case 'bold':
        document.execCommand('bold', false, undefined);
        setCurrentFormat((prev) => ({ ...prev, bold: !prev.bold }));
        break;
      case 'italic':
        document.execCommand('italic', false, undefined);
        setCurrentFormat((prev) => ({ ...prev, italic: !prev.italic }));
        break;
      case 'underline':
        document.execCommand('underline', false, undefined);
        setCurrentFormat((prev) => ({ ...prev, underline: !prev.underline }));
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false, undefined);
        setCurrentFormat((prev) => ({ ...prev, strikethrough: !prev.strikethrough }));
        break;
      case 'code':
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const selectedText = range.toString();
          const code = document.createElement('code');
          code.textContent = selectedText;
          range.deleteContents();
          range.insertNode(code);
        }
        break;
      case 'textColor':
        if (value) {
          document.execCommand('foreColor', false, value);
          setCurrentFormat((prev) => ({ ...prev, color: value }));
        }
        break;
      case 'highlight':
        if (value) {
          document.execCommand('hiliteColor', false, value);
          setCurrentFormat((prev) => ({ ...prev, backgroundColor: value }));
        }
        break;
      case 'clearMarks':
        document.execCommand('removeFormat', false, undefined);
        setCurrentFormat({});
        break;
      case 'clearNodes':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'paragraph':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'h1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'h4':
        document.execCommand('formatBlock', false, 'h4');
        break;
      case 'h5':
        document.execCommand('formatBlock', false, 'h5');
        break;
      case 'h6':
        document.execCommand('formatBlock', false, 'h6');
        break;
      case 'bulletList':
        document.execCommand('insertUnorderedList', false, undefined);
        break;
      case 'numberedList':
        document.execCommand('insertOrderedList', false, undefined);
        break;
      case 'codeBlock':
        document.execCommand('formatBlock', false, 'pre');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'horizontalRule':
        document.execCommand('insertHorizontalRule', false, undefined);
        break;
      case 'hardBreak':
        document.execCommand('insertLineBreak', false, undefined);
        break;
      case 'alignLeft':
        document.execCommand('justifyLeft', false, undefined);
        break;
      case 'alignCenter':
        document.execCommand('justifyCenter', false, undefined);
        break;
      case 'alignRight':
        document.execCommand('justifyRight', false, undefined);
        break;
      case 'undo':
        document.execCommand('undo', false, undefined);
        break;
      case 'redo':
        document.execCommand('redo', false, undefined);
        break;
    }

    if (savedRange && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } catch (e) {
        console.error('Error restoring selection:', e);
      }
    }

    setTimeout(() => {
      if (editorRef.current) {
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    }, 10);
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    isUpdatingRef.current = true;

    const html = editorRef.current.innerHTML || '';
    updateContent(html);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      setSelection({
        start: range.startOffset,
        end: range.endOffset
      });
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [updateContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleToolbarAction('bold');
          break;
        case 'i':
          e.preventDefault();
          handleToolbarAction('italic');
          break;
        case 'u':
          e.preventDefault();
          handleToolbarAction('underline');
          break;
        case 'z':
          e.preventDefault();
          handleToolbarAction('undo');
          break;
        case 'y':
          e.preventDefault();
          handleToolbarAction('redo');
          break;
      }
    }
  };

  const editorStyles = useMemo(() => {
    const styles: React.CSSProperties = {};

    if (currentFormat.bold) styles.fontWeight = 'bold';
    if (currentFormat.italic) styles.fontStyle = 'italic';
    if (currentFormat.underline) styles.textDecoration = 'underline';
    if (currentFormat.strikethrough) {
      styles.textDecoration = styles.textDecoration
        ? `${styles.textDecoration} line-through`
        : 'line-through';
    }
    if (currentFormat.color) styles.color = currentFormat.color;
    if (currentFormat.backgroundColor) styles.backgroundColor = currentFormat.backgroundColor;
    if (currentFormat.fontSize) styles.fontSize = `${currentFormat.fontSize}px`;
    if (currentFormat.fontFamily) styles.fontFamily = currentFormat.fontFamily;

    return styles;
  }, [currentFormat]);

  const stats = useMemo(() => {
    const text = editorRef.current?.textContent || '';
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    return { chars, words, lines, blocks: blocks.length };
  }, [content, blocks.length]);

  return (
    <>
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <Toolbar onAction={handleToolbarAction} currentFormat={currentFormat} />

        <div className="p-6">
          {/* Virtualization Toggle for Testing */}
          <div className="mb-4 flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useVirtualization}
                onChange={(e) => setUseVirtualization(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-gray-700">
                Enable Virtualization {useVirtualization && `(${blocks.length} blocks)`}
              </span>
            </label>
            {useVirtualization && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                ⚡ Virtualized - Only visible blocks rendered
              </span>
            )}
          </div>

          {useVirtualization ? (
            // Virtualized Mode
            <div
              ref={editorContainerRef}
              className="min-h-[500px] max-h-[600px] overflow-auto border border-gray-200 rounded-md"
            >
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
                      className="p-4"
                    >
                      <div
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: block.content }}
                        className="focus:outline-none"
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        suppressContentEditableWarning
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Standard Mode (current implementation)
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className="min-h-[500px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md border border-gray-200 transition-shadow duration-200"
              style={editorStyles}
              suppressContentEditableWarning
              spellCheck
            />
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <span>Characters: {stats.chars}</span>
              <span>Words: {stats.words}</span>
              <span>Lines: {stats.lines}</span>
              {useVirtualization && <span>Blocks: {stats.blocks}</span>}
            </div>
            <span className="text-gray-500">
              Powered by Loro CRDT {useVirtualization && '+ TanStack Virtual'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mb-8">
        <Preview content={content} mode={previewMode} onModeChange={setPreviewMode} />
      </div>
    </>
  );
};

export default memo(VirtualizedEditor);
