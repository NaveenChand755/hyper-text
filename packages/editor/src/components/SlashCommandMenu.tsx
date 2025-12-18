import React, { useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  FileCode,
  Quote,
  Image,
  Table,
  Minus,
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
  action: string;
}

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  position: { top: number; left: number };
  query: string;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  commands,
  selectedIndex,
  onSelect,
  position,
  query,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = commands.filter(
    cmd =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    // Scroll selected item into view
    if (menuRef.current) {
      const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="slash-command-menu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxHeight: '300px',
        overflowY: 'auto',
        minWidth: '250px',
        zIndex: 1000,
      }}
    >
      {filteredCommands.map((command, index) => (
        <div
          key={command.id}
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(command)}
          style={{
            padding: '0.625rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: index === selectedIndex ? '#eff6ff' : 'transparent',
            borderLeft: index === selectedIndex ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
          >
            {command.icon}
          </div>
          <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
            {command.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Default slash commands
export const defaultSlashCommands: SlashCommand[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    icon: <Heading1 size={18} />,
    keywords: ['h1', 'heading', 'title'],
    action: 'h1',
  },
  {
    id: 'h2',
    label: 'Heading 2',
    icon: <Heading2 size={18} />,
    keywords: ['h2', 'heading', 'subtitle'],
    action: 'h2',
  },
  {
    id: 'h3',
    label: 'Heading 3',
    icon: <Heading3 size={18} />,
    keywords: ['h3', 'heading', 'subheading'],
    action: 'h3',
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    icon: <List size={18} />,
    keywords: ['ul', 'bullet', 'list', 'unordered'],
    action: 'bulletList',
  },
  {
    id: 'numberedList',
    label: 'Numbered List',
    icon: <ListOrdered size={18} />,
    keywords: ['ol', 'numbered', 'list', 'ordered'],
    action: 'numberedList',
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    icon: <FileCode size={18} />,
    keywords: ['code', 'pre', 'monospace'],
    action: 'codeBlock',
  },
  {
    id: 'blockquote',
    label: 'Quote',
    icon: <Quote size={18} />,
    keywords: ['quote', 'blockquote', 'cite'],
    action: 'blockquote',
  },
  {
    id: 'image',
    label: 'Image',
    icon: <Image size={18} />,
    keywords: ['image', 'img', 'picture', 'photo'],
    action: 'image',
  },
  {
    id: 'table',
    label: 'Table',
    icon: <Table size={18} />,
    keywords: ['table', 'grid'],
    action: 'table',
  },
  {
    id: 'divider',
    label: 'Divider',
    icon: <Minus size={18} />,
    keywords: ['divider', 'hr', 'horizontal', 'line'],
    action: 'horizontalRule',
  },
];
