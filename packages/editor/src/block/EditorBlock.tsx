import React, { memo } from 'react';
import { Toolbar } from '../components/Toolbar';
import { Editor } from '../components/Editor';
import { Preview } from '../components/Preview';
import { useLoroEditor } from '../hooks/useLoroEditor';
import { editorTokens } from '../lib/tokens';
import { cn } from '../lib/utils';
import type { ToolbarAction, TextFormat, PreviewMode } from '../types/editor';

export interface EditorBlockProps {
  /**
   * Initial content (HTML string)
   */
  initialContent?: string;

  /**
   * Show preview panel
   */
  showPreview?: boolean;

  /**
   * Show toolbar
   */
  showToolbar?: boolean;

  /**
   * External content control (for controlled component)
   */
  externalContent?: string;

  /**
   * Content change handler (for controlled component)
   */
  onContentChange?: (content: string) => void;

  /**
   * Custom class name for container
   */
  className?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Custom design tokens
   */
  tokens?: typeof editorTokens;
}

const EditorBlockComponent: React.FC<EditorBlockProps> = ({
  showPreview = false,
  showToolbar = true,
  externalContent,
  onContentChange,
  className,
  placeholder = 'Start typing...',
  tokens = editorTokens,
}) => {
  const internalEditor = useLoroEditor();
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>('html');
  const [currentFormat, setCurrentFormat] = React.useState<TextFormat>({});

  // Use external content if provided, otherwise use internal
  const content = externalContent !== undefined ? externalContent : internalEditor.content;
  const updateContent = onContentChange !== undefined ? onContentChange : internalEditor.updateContent;

  const handleToolbarAction = (action: ToolbarAction, value?: string) => {
    switch (action) {
      case 'bold':
        document.execCommand('bold');
        setCurrentFormat((prev) => ({ ...prev, bold: !prev.bold }));
        break;
      case 'italic':
        document.execCommand('italic');
        setCurrentFormat((prev) => ({ ...prev, italic: !prev.italic }));
        break;
      case 'underline':
        document.execCommand('underline');
        setCurrentFormat((prev) => ({ ...prev, underline: !prev.underline }));
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough');
        setCurrentFormat((prev) => ({ ...prev, strikethrough: !prev.strikethrough }));
        break;
      case 'code':
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const selectedText = range.toString();

          // If selection is empty, check if we're inside a code element
          if (!selectedText) {
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
              node = node.parentNode as Node;
            }

            // Find if we're inside a code element
            let codeElement: HTMLElement | null = null;
            let current: Node | null = node;
            while (current && current !== document.body) {
              if (current.nodeName === 'CODE') {
                codeElement = current as HTMLElement;
                break;
              }
              current = current.parentNode;
            }

            // If we're inside code, unwrap it
            if (codeElement && codeElement.parentNode) {
              const textNode = document.createTextNode(codeElement.textContent || '');
              codeElement.parentNode.replaceChild(textNode, codeElement);

              // Place cursor after the text
              const newRange = document.createRange();
              newRange.setStartAfter(textNode);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } else {
            // Wrap selection in code
            const code = document.createElement('code');
            code.className = 'px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-sm';
            code.textContent = selectedText;
            range.deleteContents();
            range.insertNode(code);

            // Add a space after code element to allow continuing
            const space = document.createTextNode('\u200B'); // Zero-width space
            code.parentNode?.insertBefore(space, code.nextSibling);

            // Move cursor after the code element
            const newRange = document.createRange();
            newRange.setStartAfter(code);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
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
        document.execCommand('removeFormat');
        setCurrentFormat({});
        break;
      case 'clearNodes':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'paragraph':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        document.execCommand('formatBlock', false, action);
        break;
      case 'bulletList':
        document.execCommand('insertUnorderedList');
        break;
      case 'numberedList':
        document.execCommand('insertOrderedList');
        break;
      case 'codeBlock':
        document.execCommand('formatBlock', false, 'pre');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'horizontalRule':
        document.execCommand('insertHorizontalRule');
        break;
      case 'hardBreak':
        document.execCommand('insertLineBreak');
        break;
      case 'image':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
          }

          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;

              // Insert image using document.execCommand
              document.execCommand('insertImage', false, base64);

              // Find the inserted image and add styling
              setTimeout(() => {
                const images = document.querySelectorAll('.hyper-editor [contenteditable] img');
                const lastImage = images[images.length - 1] as HTMLImageElement;
                if (lastImage && !lastImage.classList.contains('editor-image')) {
                  lastImage.classList.add('editor-image');
                  lastImage.style.maxWidth = '100%';
                  lastImage.style.height = 'auto';
                  lastImage.style.borderRadius = '0.5rem';
                  lastImage.style.margin = '1rem 0';
                }
              }, 10);
            };
            reader.onerror = () => {
              alert('Failed to read image file');
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image');
          }
        };
        input.click();
        break;
      case 'table':
        const tableHTML = `
          <table style="border-collapse: collapse; width: 100%; margin: 1em 0;">
            <tbody>
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem; min-width: 100px;">Cell 1</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem; min-width: 100px;">Cell 2</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem; min-width: 100px;">Cell 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 4</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 5</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 6</td>
              </tr>
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 7</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 8</td>
                <td style="border: 1px solid #e5e7eb; padding: 0.5rem;">Cell 9</td>
              </tr>
            </tbody>
          </table>
          <p><br></p>
        `.trim();
        document.execCommand('insertHTML', false, tableHTML);
        break;
      case 'undo':
        document.execCommand('undo');
        break;
      case 'redo':
        document.execCommand('redo');
        break;
    }
  };

  return (
    <div className={cn('hyper-editor', className)}>
      <div className={tokens.container.base}>
        {showToolbar && (
          <Toolbar
            onAction={handleToolbarAction}
            currentFormat={currentFormat}
            tokens={tokens}
          />
        )}

        <Editor
          content={content}
          onContentChange={updateContent}
          placeholder={placeholder}
          tokens={tokens}
        />

        <div className={tokens.stats.container}>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <span className={tokens.stats.item}>
                Characters: {content.replace(/<[^>]*>/g, '').length}
              </span>
              <span className={tokens.stats.item}>
                Words: {content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="mt-8">
          <Preview
            content={content}
            mode={previewMode}
            onModeChange={setPreviewMode}
          />
        </div>
      )}
    </div>
  );
};

export const EditorBlock = memo(EditorBlockComponent);
export default EditorBlock;
