# NextText Editor

> A modern, customizable rich text editor for React with shadcn/ui patterns, Tailwind CSS styling, and collaborative editing powered by Loro CRDT.

[![npm version](https://img.shields.io/npm/v/nextext-editor)](https://www.npmjs.com/package/nextext-editor)

## Features

- 🎨 **Rich Formatting** - Bold, italic, underline, strikethrough, inline code, text color, and highlighting
- 📝 **Block Types** - Headings (H1-H6), paragraphs, bullet lists, numbered lists, blockquotes, code blocks, horizontal rules
- 🖼️ **Media Support** - Image upload with drag-and-drop (max 5MB, auto-styled)
- 📊 **Tables** - Insert and edit tables with styled cells
- 🔄 **Built-in Collaboration** - Loro CRDT for conflict-free real-time editing
- 🎨 **Customizable Design** - shadcn/ui-inspired design tokens for easy theming
- 📱 **Responsive** - Works seamlessly on desktop and mobile
- ⌨️ **Keyboard Shortcuts** - Familiar shortcuts (Ctrl/Cmd+B, I, U, Z, Y)
- 🔍 **Live Preview** - View your content in HTML, Text, or JSON format
- 📊 **Word & Character Count** - Real-time statistics display
- 🎯 **TypeScript** - Fully typed for better DX

## Installation

```bash
npm install nextext-editor
# or
yarn add nextext-editor
# or
pnpm add nextext-editor
```

## Quick Start

### Basic Usage

```tsx
import { EditorBlock } from 'nextext-editor';
import 'nextext-editor/styles.css';

function App() {
  return <EditorBlock placeholder="Start writing..." />;
}
```

### With Preview Panel

```tsx
import { EditorBlock } from 'nextext-editor';
import 'nextext-editor/styles.css';

function App() {
  return (
    <EditorBlock
      showPreview
      placeholder="Start writing..."
    />
  );
}
```

### Controlled Mode with External State

```tsx
import { useState } from 'react';
import { EditorBlock } from 'nextext-editor';
import 'nextext-editor/styles.css';

function App() {
  const [content, setContent] = useState('<p>Initial content</p>');

  return (
    <EditorBlock
      externalContent={content}
      onContentChange={setContent}
      showPreview
    />
  );
}
```

### Using Loro CRDT for Collaboration

```tsx
import { useLoroEditor, EditorBlock } from 'nextext-editor';
import 'nextext-editor/styles.css';

function CollaborativeEditor() {
  const { content, updateContent, loroDoc } = useLoroEditor();

  // Share loroDoc with other clients for real-time sync

  return (
    <EditorBlock
      externalContent={content}
      onContentChange={updateContent}
    />
  );
}
```

### Using Editor Directly (Headless)

If you want to build your own toolbar and UI, use the low-level `Editor` component:

```tsx
import { useState } from 'react';
import { Editor } from 'nextext-editor';
import 'nextext-editor/styles.css';

function CustomEditor() {
  const [content, setContent] = useState('<p>Start typing...</p>');

  return (
    <div>
      <div className="my-custom-toolbar">
        <button onClick={() => document.execCommand('bold')}>Bold</button>
        <button onClick={() => document.execCommand('italic')}>Italic</button>
      </div>
      <Editor
        content={content}
        onContentChange={setContent}
        placeholder="Write something..."
      />
    </div>
  );
}
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Loro CRDT** - Conflict-free collaboration
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## API Reference

### Editor Props (Core ContentEditable Component)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | **required** | HTML content to display |
| `onContentChange` | `(html: string) => void` | **required** | Called when content changes |
| `placeholder` | `string` | `"Start typing..."` | Placeholder text when empty |
| `className` | `string` | - | Custom class for the editable area |
| `tokens` | `EditorTokens` | `editorTokens` | Custom design tokens |

### EditorBlock Props (Complete Editor with Toolbar & Preview)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `string` | - | Initial HTML content |
| `showPreview` | `boolean` | `false` | Show live preview panel |
| `showToolbar` | `boolean` | `true` | Show formatting toolbar |
| `externalContent` | `string` | - | Controlled content (for controlled mode) |
| `onContentChange` | `(html: string) => void` | - | Content change callback |
| `className` | `string` | - | Custom container class |
| `placeholder` | `string` | `"Start typing..."` | Placeholder text |
| `tokens` | `EditorTokens` | `editorTokens` | Custom design tokens |

### useLoroEditor Hook

Returns an object with:

```tsx
{
  content: string;              // Current HTML content
  format: TextFormat;           // Current text format state
  updateContent: (html: string) => void;  // Update content
  insertText: (text: string, position?: number) => void;  // Insert text
  deleteText: (start: number, length: number) => void;  // Delete text
  applyFormat: (start: number, end: number, format: TextFormat) => void;  // Apply formatting
  getSnapshot: () => Uint8Array;  // Export Loro snapshot
  loadSnapshot: (snapshot: Uint8Array) => void;  // Import Loro snapshot
  loroDoc: Loro | null;         // Raw Loro document instance
}
```

### Design Tokens

Customize the editor's appearance by passing custom tokens:

```tsx
import { EditorBlock, editorTokens } from 'nextext-editor';

const customTokens = {
  ...editorTokens,
  container: {
    ...editorTokens.container,
    base: 'w-full bg-slate-900 rounded-xl border border-slate-700',
  },
  editor: {
    ...editorTokens.editor,
    base: 'min-h-[500px] p-8 text-slate-100',
  },
};

function App() {
  return <EditorBlock tokens={customTokens} />;
}
```

## Toolbar Actions

The editor supports these formatting actions:

### Text Formatting
- `bold` - Toggle bold text
- `italic` - Toggle italic text
- `underline` - Toggle underline
- `strikethrough` - Toggle strikethrough
- `code` - Toggle inline code
- `textColor` - Change text color
- `highlight` - Change background color
- `clearMarks` - Remove all formatting

### Block Types
- `paragraph` - Normal paragraph
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` - Headings
- `bulletList` - Unordered list
- `numberedList` - Ordered list
- `codeBlock` - Code block
- `blockquote` - Blockquote
- `clearNodes` - Reset to paragraph

### Content
- `image` - Upload image (max 5MB)
- `table` - Insert 3x3 table
- `horizontalRule` - Insert horizontal line
- `hardBreak` - Insert line break

### History
- `undo` - Undo last change
- `redo` - Redo last change

## Keyboard Shortcuts

- **Ctrl/Cmd + B** - Bold
- **Ctrl/Cmd + I** - Italic
- **Ctrl/Cmd + U** - Underline
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** - Redo

## Architecture

The editor follows a clean component hierarchy:

```
Editor (Core - in components/)
└── Low-level contentEditable component
    └── Handles HTML editing, cursor management, keyboard events

EditorBlock (Complete Editor - in block/)
├── Uses Editor component
├── Adds Toolbar
├── Adds Preview panel
├── Adds word/character count
└── Integrates with Loro CRDT via useLoroEditor hook
```

**File Structure:**
```
src/
├── components/
│   ├── Editor.tsx          ← Core contentEditable (low-level)
│   ├── Toolbar.tsx
│   ├── Preview.tsx
│   └── ...
├── block/
│   └── EditorBlock.tsx     ← Complete editor (high-level)
├── hooks/
│   └── useLoroEditor.ts
└── index.ts
```

## Exported Components

```tsx
import {
  Editor,           // Core contentEditable component (low-level)
  EditorBlock,      // Complete editor with toolbar & preview (high-level)
  Toolbar,          // Formatting toolbar component
  Preview,          // Preview panel component
  ColorPicker,      // Color picker dropdown
  HeadingSelector,  // Heading selector dropdown
} from 'nextext-editor';
```

## Exported Utilities

```tsx
import {
  useLoroEditor,    // Loro CRDT hook
  editorTokens,     // Default design tokens
  cn,               // className utility (clsx + tailwind-merge)
} from 'nextext-editor';
```

## TypeScript Types

```tsx
import type {
  TextFormat,       // Text formatting state
  EditorState,      // Editor state
  ToolbarAction,    // Toolbar action types
  PreviewMode,      // Preview mode ('html' | 'text' | 'json')
  EditorTokens,     // Design tokens type
  EditorBlockProps, // EditorBlock props
} from 'nextext-editor';
```

## License

MIT © [NaveenChand](https://github.com/NaveenChand755)

## Contributing

Contributions are welcome! Please check out the [GitHub repository](https://github.com/NaveenChand755/hyper-text).

## Support

- 🐛 [Report Issues](https://github.com/NaveenChand755/hyper-text/issues)
- 💬 [Discussions](https://github.com/NaveenChand755/hyper-text/discussions)
- 📖 [Documentation](https://github.com/NaveenChand755/hyper-text#readme)
