/**
 * Design tokens for HyperText Editor
 * Following shadcn/ui patterns for easy customization
 */

export const editorTokens = {
  // Container
  container: {
    base: 'w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
    focused: 'ring-2 ring-blue-500/20 ring-offset-2',
  },

  // Editor area
  editor: {
    container: 'max-h-[600px] overflow-y-auto scroll-smooth',
    base: 'min-h-[500px] p-8 focus:outline-none prose prose-base max-w-none text-gray-900 leading-relaxed',
    placeholder: 'text-gray-400',
  },

  // Toolbar
  toolbar: {
    base: 'flex flex-wrap items-center gap-1 px-4 py-3 border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm',
    group: 'flex items-center gap-1 px-1',
    separator: 'w-px h-5 bg-gray-300 mx-2',
  },

  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-40',
    default: 'h-9 px-3 bg-white hover:bg-blue-50 hover:text-blue-600 border border-gray-200',
    icon: 'h-9 w-9 hover:bg-blue-50 hover:text-blue-600 text-gray-600',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
  },

  // Dropdown/Menu
  dropdown: {
    trigger: 'inline-flex items-center justify-center rounded-lg text-sm font-medium h-9 px-3 hover:bg-blue-50 hover:text-blue-600 text-gray-700',
    content: 'z-50 min-w-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg',
    item: 'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-blue-50 hover:text-blue-600 text-gray-700',
  },

  // Color picker
  colorPicker: {
    trigger: 'h-9 w-9 rounded-lg border-2 border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all',
    popover: 'rounded-xl border border-gray-200 bg-white p-4 shadow-lg',
    grid: 'grid grid-cols-5 gap-2',
    swatch: 'h-8 w-8 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all hover:scale-110',
  },

  // Status/Stats
  stats: {
    container: 'px-6 py-3 bg-gray-50/80 border-t border-gray-200 text-sm text-gray-600',
    item: 'inline-flex items-center gap-1.5 font-medium',
  },
} as const;

export type EditorTokens = typeof editorTokens;
