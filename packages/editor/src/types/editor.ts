export interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface EditorState {
  content: string;
  selection: {
    start: number;
    end: number;
  };
  currentFormat: TextFormat;
}

export type ToolbarAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'textColor'
  | 'highlight'
  | 'clearMarks'
  | 'clearNodes'
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'bulletList'
  | 'numberedList'
  | 'codeBlock'
  | 'blockquote'
  | 'horizontalRule'
  | 'hardBreak'
  | 'image'
  | 'table'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'undo'
  | 'redo';

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

export type PreviewMode = 'html' | 'text' | 'json';
