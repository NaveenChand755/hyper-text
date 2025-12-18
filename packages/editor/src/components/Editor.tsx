import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Toolbar } from './Toolbar';
import { Preview } from './Preview';
import { MentionDropdown } from './MentionDropdown';
import { SlashCommandMenu, defaultSlashCommands, SlashCommand } from './SlashCommandMenu';
import { useLoroEditor } from '../hooks/useLoroEditor';
import { ToolbarAction, TextFormat, PreviewMode, MentionUser } from '../types/editor';
import { Zap } from 'lucide-react';

interface EditorProps {
  enableVirtualization?: boolean;
  showVirtualizationToggle?: boolean;
  showPreview?: boolean;
  externalContent?: string;
  onContentChange?: (content: string) => void;
}

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

const EditorComponent: React.FC<EditorProps> = ({
  enableVirtualization: initialVirtualization = false,
  showVirtualizationToggle = false,
  showPreview = true,
  externalContent,
  onContentChange,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('html');
  const [useVirtualization, setUseVirtualization] = useState(initialVirtualization);
  const internalEditor = useLoroEditor();
  const content = externalContent !== undefined ? externalContent : internalEditor.content;
  const updateContent = onContentChange !== undefined ? onContentChange : internalEditor.updateContent;

  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const mentionStartRef = useRef<number>(0);

  // Slash commands state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const slashStartRef = useRef<number>(0);

  // Sample users for mentions (in real app, this would come from props or API)
  const mentionUsers: MentionUser[] = useMemo(() => [
    { id: '1', name: 'John Doe', avatar: undefined },
    { id: '2', name: 'Jane Smith', avatar: undefined },
    { id: '3', name: 'Alice Johnson', avatar: undefined },
    { id: '4', name: 'Bob Wilson', avatar: undefined },
    { id: '5', name: 'Charlie Brown', avatar: undefined },
  ], []);

  // Update virtualization when prop changes
  useEffect(() => {
    setUseVirtualization(initialVirtualization);
  }, [initialVirtualization]);

  const blocks = useMemo(() => {
    if (!useVirtualization || !content) return [];
    return parseContentIntoBlocks(content);
  }, [content, useVirtualization]);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => editorContainerRef.current,
    estimateSize: () => 50,
    overscan: 5,
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
    } catch {
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

  // Update editor content from Loro (only for standard mode)
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current || useVirtualization) return;

    const cursorPos = saveCursorPosition();

    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;

      if (cursorPos !== null) {
        restoreCursorPosition(cursorPos);
      }
    }
  }, [content, saveCursorPosition, restoreCursorPosition, useVirtualization]);

  const handleToolbarAction = useCallback((action: ToolbarAction, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

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
      case 'image':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/gif,image/webp';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              if (savedRange && selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
              }
              document.execCommand('insertImage', false, base64);

              // Trigger input event to update content
              setTimeout(() => {
                if (editorRef.current) {
                  const event = new Event('input', { bubbles: true });
                  editorRef.current.dispatchEvent(event);
                }
              }, 10);
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        };
        input.click();
        return; // Return early to avoid triggering input event before image loads
      case 'alignLeft':
        document.execCommand('justifyLeft', false, undefined);
        break;
      case 'alignCenter':
        document.execCommand('justifyCenter', false, undefined);
        break;
      case 'alignRight':
        document.execCommand('justifyRight', false, undefined);
        break;
      case 'table':
        // Insert a simple 3x3 table
        const table = `
          <table style="border-collapse: collapse; width: 100%; margin: 1em 0;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 100px;">Cell 1</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 100px;">Cell 2</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 100px;">Cell 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 7</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 8</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 9</td>
              </tr>
            </tbody>
          </table>
          <p><br></p>
        `.trim();
        document.execCommand('insertHTML', false, table);
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

    // Check for @ mention trigger
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || '';

      // Check for @ mention
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      if (mentionMatch) {
        setShowMentions(true);
        setMentionQuery(mentionMatch[1]);
        setSelectedMentionIndex(0);

        // Get cursor position for dropdown
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom - editorRect.top + 5,
          left: rect.left - editorRect.left,
        });
      } else {
        setShowMentions(false);
      }

      // Check for / slash command
      const slashMatch = textBeforeCursor.match(/(?:^|\s)\/(\w*)$/);
      if (slashMatch) {
        setShowSlashMenu(true);
        setSlashQuery(slashMatch[1]);
        setSelectedCommandIndex(0);

        // Get cursor position for menu
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        setSlashPosition({
          top: rect.bottom - editorRect.top + 5,
          left: rect.left - editorRect.left,
        });
      } else {
        setShowSlashMenu(false);
      }
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [updateContent]);

  // Helper functions for mentions and slash commands
  const insertMention = useCallback((user: MentionUser) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const textContent = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Find and replace @query with mention
    const beforeCursor = textContent.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    const afterCursor = textContent.slice(cursorPos);

    // Create mention span
    const mentionSpan = document.createElement('span');
    mentionSpan.className = 'mention';
    mentionSpan.setAttribute('data-user-id', user.id);
    mentionSpan.contentEditable = 'false';
    mentionSpan.style.color = '#3b82f6';
    mentionSpan.style.backgroundColor = '#eff6ff';
    mentionSpan.style.padding = '2px 6px';
    mentionSpan.style.borderRadius = '4px';
    mentionSpan.style.fontWeight = '500';
    mentionSpan.textContent = `@${user.name}`;

    // Replace text
    if (textNode.nodeType === Node.TEXT_NODE) {
      const newText = textContent.slice(0, atIndex) + afterCursor;
      textNode.textContent = newText;

      const newRange = document.createRange();
      newRange.setStart(textNode, atIndex);
      newRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(newRange);

      newRange.insertNode(mentionSpan);

      // Add space after mention
      const space = document.createTextNode(' ');
      mentionSpan.parentNode?.insertBefore(space, mentionSpan.nextSibling);

      // Move cursor after space
      newRange.setStartAfter(space);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    setShowMentions(false);
    handleInput();
  }, [handleInput]);

  const executeSlashCommand = useCallback((command: SlashCommand) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const textContent = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Remove /command text
    const beforeCursor = textContent.slice(0, cursorPos);
    const slashIndex = beforeCursor.lastIndexOf('/');
    const afterCursor = textContent.slice(cursorPos);

    if (textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = textContent.slice(0, slashIndex) + afterCursor;

      const newRange = document.createRange();
      newRange.setStart(textNode, slashIndex);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    setShowSlashMenu(false);

    // Execute the command
    setTimeout(() => {
      handleToolbarAction(command.action as ToolbarAction);
    }, 10);
  }, [handleToolbarAction]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle mention dropdown navigation
    if (showMentions) {
      const filteredUsers = mentionUsers.filter(u =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredUsers[selectedMentionIndex]) {
          insertMention(filteredUsers[selectedMentionIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Handle slash command menu navigation
    if (showSlashMenu) {
      const filteredCommands = defaultSlashCommands.filter(
        cmd =>
          cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
          cmd.keywords.some(k => k.toLowerCase().includes(slashQuery.toLowerCase()))
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands[selectedCommandIndex]) {
          executeSlashCommand(filteredCommands[selectedCommandIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    // Regular keyboard shortcuts
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

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();

        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            document.execCommand('insertImage', false, base64);

            setTimeout(() => {
              if (editorRef.current) {
                const event = new Event('input', { bubbles: true });
                editorRef.current.dispatchEvent(event);
              }
            }, 10);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      e.preventDefault();

      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          document.execCommand('insertImage', false, base64);

          setTimeout(() => {
            if (editorRef.current) {
              const event = new Event('input', { bubbles: true });
              editorRef.current.dispatchEvent(event);
            }
          }, 10);
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

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
      <div className="hyper-editor w-full max-w-5xl mx-auto my-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <Toolbar onAction={handleToolbarAction} currentFormat={currentFormat} />

        <div className="p-6 relative">
          {/* Virtualization Toggle */}
          {showVirtualizationToggle && (
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
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                  <Zap size={12} /> Virtualized - Only visible blocks rendered
                </span>
              )}
            </div>
          )}

          {useVirtualization ? (
            // Virtualized Mode
            <div
              ref={editorContainerRef}
              data-editor-scroll-container
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
                        onPaste={handlePaste}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        suppressContentEditableWarning
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Standard Mode
            <div
              data-editor-scroll-container
              className="min-h-[500px] max-h-[600px] overflow-auto border border-gray-200 rounded-md"
            >
              <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="min-h-[500px] p-4 focus:outline-none"
                style={editorStyles}
                suppressContentEditableWarning
                spellCheck
              />
            </div>
          )}

          {/* Mention Dropdown */}
          {showMentions && (
            <MentionDropdown
              users={mentionUsers}
              selectedIndex={selectedMentionIndex}
              onSelect={insertMention}
              position={mentionPosition}
              query={mentionQuery}
            />
          )}

          {/* Slash Command Menu */}
          {showSlashMenu && (
            <SlashCommandMenu
              commands={defaultSlashCommands}
              selectedIndex={selectedCommandIndex}
              onSelect={executeSlashCommand}
              position={slashPosition}
              query={slashQuery}
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
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="w-full max-w-5xl mx-auto mb-8">
          <Preview content={content} mode={previewMode} onModeChange={setPreviewMode} />
        </div>
      )}
    </>
  );
};

export const Editor = memo(EditorComponent);
export default Editor;
