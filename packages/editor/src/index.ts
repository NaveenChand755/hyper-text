// Core Components
export { Editor } from './components/Editor';
export type { EditorProps } from './components/Editor';

// High-level Blocks
export { EditorBlock } from './block';
export type { EditorBlockProps } from './block';

// Sub-components
export { Toolbar } from './components/Toolbar';
export { Preview } from './components/Preview';
export { ColorPicker } from './components/ColorPicker';
export { HeadingSelector } from './components/HeadingSelector';

// Hooks
export { useLoroEditor } from './hooks/useLoroEditor';

// Types
export type {
  TextFormat,
  EditorState,
  ToolbarAction,
  PreviewMode,
} from './types/editor';

// Design tokens & utilities (shadcn pattern)
export { editorTokens } from './lib/tokens';
export type { EditorTokens } from './lib/tokens';
export { cn } from './lib/utils';

// Styles
import './styles/editor.css';
