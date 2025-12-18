import React, { memo, useMemo } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Eraser,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  FileCode,
  Quote,
  Minus,
  CornerDownLeft,
  Image,
  Table,
} from 'lucide-react';
import { ToolbarAction, TextFormat } from '../types/editor';
import { ColorPicker } from './ColorPicker';
import { HeadingSelector } from './HeadingSelector';

interface ToolbarProps {
  onAction: (action: ToolbarAction, value?: string) => void;
  currentFormat: TextFormat;
}

interface ToolbarButton {
  action: ToolbarAction;
  icon: React.ElementType;
  title: string;
  isActive?: boolean;
}

const ToolbarComponent: React.FC<ToolbarProps> = ({ onAction, currentFormat }) => {
  const toolbarButtons: (ToolbarButton | { divider: true })[] = [
    {
      action: 'undo' as ToolbarAction,
      icon: Undo,
      title: 'Undo (Ctrl+Z)',
    },
    {
      action: 'redo' as ToolbarAction,
      icon: Redo,
      title: 'Redo (Ctrl+Y)',
    },
    { divider: true },
    {
      action: 'bold' as ToolbarAction,
      icon: Bold,
      title: 'Bold (Ctrl+B)',
      isActive: currentFormat.bold,
    },
    {
      action: 'italic' as ToolbarAction,
      icon: Italic,
      title: 'Italic (Ctrl+I)',
      isActive: currentFormat.italic,
    },
    {
      action: 'underline' as ToolbarAction,
      icon: Underline,
      title: 'Underline (Ctrl+U)',
      isActive: currentFormat.underline,
    },
    {
      action: 'strikethrough' as ToolbarAction,
      icon: Strikethrough,
      title: 'Strikethrough',
      isActive: currentFormat.strikethrough,
    },
    {
      action: 'code' as ToolbarAction,
      icon: Code,
      title: 'Inline code',
    },
    { divider: true },
    {
      action: 'clearMarks' as ToolbarAction,
      icon: Eraser,
      title: 'Clear formatting',
    },
    {
      action: 'clearNodes' as ToolbarAction,
      icon: RemoveFormatting,
      title: 'Clear nodes',
    },
    { divider: true },
    {
      action: 'alignLeft' as ToolbarAction,
      icon: AlignLeft,
      title: 'Align left',
    },
    {
      action: 'alignCenter' as ToolbarAction,
      icon: AlignCenter,
      title: 'Align center',
    },
    {
      action: 'alignRight' as ToolbarAction,
      icon: AlignRight,
      title: 'Align right',
    },
    { divider: true },
    {
      action: 'bulletList' as ToolbarAction,
      icon: List,
      title: 'Bulleted list',
    },
    {
      action: 'numberedList' as ToolbarAction,
      icon: ListOrdered,
      title: 'Numbered list',
    },
    {
      action: 'codeBlock' as ToolbarAction,
      icon: FileCode,
      title: 'Code block',
    },
    {
      action: 'blockquote' as ToolbarAction,
      icon: Quote,
      title: 'Blockquote',
    },
    { divider: true },
    {
      action: 'horizontalRule' as ToolbarAction,
      icon: Minus,
      title: 'Horizontal rule',
    },
    {
      action: 'hardBreak' as ToolbarAction,
      icon: CornerDownLeft,
      title: 'Hard break',
    },
    {
      action: 'image' as ToolbarAction,
      icon: Image,
      title: 'Insert image',
    },
    {
      action: 'table' as ToolbarAction,
      icon: Table,
      title: 'Insert table',
    },
  ];

  // Memoize the buttons rendering to avoid re-rendering on every parent update
  const renderedButtons = useMemo(
    () =>
      toolbarButtons.map((button, index) => {
        if ('divider' in button) {
          return <div key={`divider-${index}`} className="w-px h-6 bg-gray-300 mx-1" />;
        }

        const Icon = button.icon;

        return (
          <button
            key={button.action}
            type="button"
            className={`
              flex items-center justify-center w-8 h-8 rounded
              transition-all duration-150 ease-in-out
              border border-transparent
              ${
                button.isActive
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 active:bg-blue-100 active:border-blue-400'
              }
            `}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss
              onAction(button.action);
            }}
            title={button.title}
          >
            <Icon size={16} />
          </button>
        );
      }),
    [toolbarButtons, onAction]
  );

  const handleHeadingSelect = (heading: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    if (heading === 'p') {
      onAction('paragraph');
    } else {
      onAction(heading as ToolbarAction);
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex-wrap shadow-sm">
      {renderedButtons.slice(0, 7)}
      <ColorPicker
        type="text"
        onColorSelect={(color) => onAction('textColor', color)}
        currentColor={currentFormat.color}
      />
      <ColorPicker
        type="highlight"
        onColorSelect={(color) => onAction('highlight', color)}
        currentColor={currentFormat.backgroundColor}
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <HeadingSelector onSelect={handleHeadingSelect} />
      {renderedButtons.slice(7)}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const Toolbar = memo(ToolbarComponent);
