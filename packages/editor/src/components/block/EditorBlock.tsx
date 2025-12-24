import React, { useRef, useEffect, useCallback } from 'react';
import { editorTokens } from '../../lib/tokens';
import { cn } from '../../lib/utils';

export interface EditorBlockProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  tokens?: typeof editorTokens;
}

export const EditorBlock: React.FC<EditorBlockProps> = ({
  content,
  onContentChange,
  placeholder = 'Start typing...',
  className,
  tokens = editorTokens,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current || sel.rangeCount === 0) return null;

    try {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    } catch {
      return null;
    }
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((position: number) => {
    if (!editorRef.current || position === null) return;

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

  // Handle input changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML || '';
    onContentChange(html);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [onContentChange]);

  // Handle keyboard events to help escape inline code
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }

    // Check if we're at the boundary of a code element
    let current: Node | null = node;
    while (current && current !== editorRef.current) {
      if (current.nodeName === 'CODE') {
        const codeElement = current as HTMLElement;

        // Right arrow at end of code - exit to the right
        if (e.key === 'ArrowRight' && range.endOffset === (range.endContainer.textContent?.length || 0)) {
          e.preventDefault();
          const newRange = document.createRange();
          if (codeElement.nextSibling) {
            newRange.setStart(codeElement.nextSibling, 0);
          } else {
            // Create a text node after code if none exists
            const textNode = document.createTextNode('\u200B');
            codeElement.parentNode?.insertBefore(textNode, codeElement.nextSibling);
            newRange.setStart(textNode, 0);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          return;
        }

        // Left arrow at start of code - exit to the left
        if (e.key === 'ArrowLeft' && range.startOffset === 0) {
          e.preventDefault();
          const newRange = document.createRange();
          if (codeElement.previousSibling) {
            const prev = codeElement.previousSibling;
            newRange.setStart(prev, prev.textContent?.length || 0);
          } else {
            // Create a text node before code if none exists
            const textNode = document.createTextNode('\u200B');
            codeElement.parentNode?.insertBefore(textNode, codeElement);
            newRange.setStart(textNode, 0);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          return;
        }
        break;
      }
      current = current.parentNode;
    }
  }, []);

  // Update editor content when content prop changes
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return;

    const cursorPos = saveCursorPosition();

    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;

      if (cursorPos !== null) {
        restoreCursorPosition(cursorPos);
      }
    }
  }, [content, saveCursorPosition, restoreCursorPosition]);

  return (
    <div className={cn(tokens.editor.container, 'editor-scroll-container')} data-editor-scroll-container>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(tokens.editor.base, className)}
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
      />
    </div>
  );
};
