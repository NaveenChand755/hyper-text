import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
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

export const RichTextEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [selection, setSelection] = useState<EditorSelection>({ start: 0, end: 0 });
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('html');

  const { content, updateContent } = useLoroEditor();

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
      // Return null if there's an error getting the range
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

    // Focus the editor first to ensure commands work
    editorRef.current.focus();

    // Save current selection
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
        // Wrap selection in <code> tag
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
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

    // Restore selection if needed
    if (savedRange && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } catch (e) {
        console.error('Error restoring selection:', e);
      }
    }

    // Force update of content
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

    // Use innerHTML to preserve formatting like lists, bold, etc.
    const html = editorRef.current.innerHTML || '';
    updateContent(html);

    // Update selection
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

  // Memoize editor styles to avoid recalculation on every render
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

  // Memoize word and line count for better performance
  const stats = useMemo(() => {
    // Use textContent from editor ref to get actual text without HTML tags
    const text = editorRef.current?.textContent || '';
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    return { chars, words, lines };
  }, [content]); // Keep content as dependency so it updates when content changes

  return (
    <>
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <Toolbar onAction={handleToolbarAction} currentFormat={currentFormat} />

        <div className="p-6">
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
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <span>Characters: {stats.chars}</span>
              <span>Words: {stats.words}</span>
              <span>Lines: {stats.lines}</span>
            </div>
            <span className="text-gray-500">Powered by Loro CRDT</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mb-8">
        <Preview content={content} mode={previewMode} onModeChange={setPreviewMode} />
      </div>
    </>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(RichTextEditor);
