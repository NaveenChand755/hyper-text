# HyperText Editor

> The rich text editor built for the AI era. Handle unlimited AI-generated content at 60 FPS.

[![Performance](https://img.shields.io/badge/FPS-60-success)](https://github.com)
[![Memory](https://img.shields.io/badge/Memory-12x%20less-blue)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com)

## Why HyperText?

**Traditional editors** (TipTap, ProseMirror, Quill) **choke** when handling AI-generated content:

- 🐌 Laggy scrolling with 2,000+ paragraphs
- 💾 Memory bloat (500MB+ for large docs)
- 📱 Crashes on mobile devices
- ⚠️ Poor UX for AI writing assistants

**HyperText** uses **virtual scrolling** to render only what's visible:

```
TipTap (10K blocks):        HyperText (10K blocks):
├─ Renders: 10,000 nodes    ├─ Renders: ~40 nodes
├─ Memory: 580MB            ├─ Memory: 48MB (12x less!)
└─ Scroll: 22 FPS (janky)   └─ Scroll: 60 FPS (smooth!)
```

## Perfect For AI Applications

### ✅ AI Writing Assistants
```typescript
// Stream ChatGPT responses without lag
const { content, updateContent } = useLoroEditor()

const streamAI = async () => {
  const response = await fetch('/api/ai/generate')
  const stream = response.body.getReader()

  while (true) {
    const { done, value } = await stream.read()
    if (done) break

    updateContent(content + decode(value))
    // ✅ Smooth even when AI generates 10,000+ words
  }
}
```

### ✅ Document Generation Platforms
Generate 20-page contracts, proposals, reports—all at 60 FPS.

### ✅ Real-Time AI Suggestions
Analyze entire documents and display 100+ AI suggestions without lag.

### ✅ Collaborative AI Editing
Built-in Loro CRDT for real-time collaboration (zero config).

## Features

- ⚡ **Virtual Scrolling** - Unlimited document size, constant 60 FPS
- 🤖 **AI-First** - Smooth streaming, real-time updates, no lag
- 🔄 **Built-in Collaboration** - Loro CRDT (vs TipTap's 50+ line Y.js setup)
- 💾 **Memory Efficient** - 12x less memory than TipTap
- 📱 **Mobile Optimized** - Low memory, high performance
- 🎨 **Rich Formatting** - Bold, italic, headings, lists, colors, code blocks
- ⌨️ **Google Docs UI** - Familiar toolbar, keyboard shortcuts
- 🔍 **Live Preview** - HTML, Text, JSON modes

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### AI Integration Example

```typescript
import { useLoroEditor } from './hooks/useLoroEditor'
import { VirtualizedEditor } from './components/VirtualizedEditor'

function AIWritingApp() {
  const { content, updateContent } = useLoroEditor()

  const generateWithAI = async (prompt: string) => {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    let aiContent = ''
    for await (const chunk of response) {
      aiContent += chunk.choices[0]?.delta?.content || ''
      updateContent(content + aiContent)
    }
  }

  return (
    <div>
      <VirtualizedEditor />
      <button onClick={() => generateWithAI('Write a blog post')}>
        Generate with AI
      </button>
    </div>
  )
}
```

## Performance Test

Run the built-in performance lab to see the difference:

1. Click "Performance Test" in the header
2. Generate 10,000 blocks **without** virtualization
   - Watch FPS drop to ~20-30
   - Memory spikes to 500MB+
3. Enable virtualization
   - FPS jumps to 60
   - Memory drops to ~50MB
4. Use auto-scroll to stress test

**See the difference yourself!**

## Comparison with TipTap

| Feature | TipTap | HyperText |
|---------|--------|-----------|
| **Max document size** | ~2,000 ¶ | Unlimited |
| **FPS (10K blocks)** | 22 FPS | 60 FPS |
| **Memory (10K blocks)** | 580MB | 48MB |
| **AI streaming** | Laggy | Smooth |
| **Collaboration setup** | 50+ lines | 3 lines |
| **Mobile performance** | Poor | Excellent |
| **Extension ecosystem** | 100+ | Growing |

**See detailed comparison**: [VS_TIPTAP_PROSEMIRROR.md](./VS_TIPTAP_PROSEMIRROR.md)

## AI Use Cases

### 1. AI Writing Assistant (like Jasper.ai)
Stream AI content without performance issues.

### 2. Document Generator (Contracts, Proposals)
Generate 20-page documents instantly without lag.

### 3. Real-Time Suggestions (like Grammarly)
Analyze 10,000 words and show suggestions while maintaining 60 FPS.

### 4. Collaborative AI Editing
Team + AI editing simultaneously with Loro CRDT handling conflicts automatically.

**More examples**: [MARKETING.md#ai-use-cases](./MARKETING.md#ai-use-cases-the-killer-feature)

## Architecture

```
HyperText
├── RichTextEditor (Standard mode)
│   ├── Toolbar (Google Docs style)
│   ├── ContentEditable area
│   └── Preview (HTML/Text/JSON)
│
├── VirtualizedEditor (Performance mode)
│   ├── TanStack Virtual (render only visible)
│   ├── Block parser (split into chunks)
│   └── Dynamic measurements
│
├── PerformanceTest (Benchmarking lab)
│   ├── Generate up to 20K blocks
│   ├── Real-time FPS measurement
│   ├── Memory monitoring
│   └── Auto-scroll testing
│
└── Loro CRDT (Collaboration)
    ├── Conflict-free merging
    ├── Offline support
    └── Real-time sync
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Loro CRDT** - Collaboration (built-in)
- **TanStack Virtual** - Virtual scrolling
- **TanStack Query** - Data fetching
- **Tailwind CSS v4** - Styling
- **Vite 6** - Build tool
- **Lucide React** - Icons

## Documentation

- [Performance Test Guide](./PERFORMANCE_TEST_GUIDE.md)
- [FPS Measurement Explained](./FPS_MEASUREMENT_EXPLAINED.md)
- [vs TipTap/ProseMirror](./VS_TIPTAP_PROSEMIRROR.md)
- [Marketing & Positioning](./MARKETING.md)

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo

## Project Structure (Monorepo)

```
hyper-text/
├── packages/
│   └── editor/                      # @hyper-text/editor (NPM package)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Editor.tsx       # Main editor (virtualized + standard)
│       │   │   ├── Toolbar.tsx      # Google Docs toolbar
│       │   │   ├── HeadingSelector.tsx
│       │   │   ├── ColorPicker.tsx
│       │   │   └── Preview.tsx
│       │   ├── hooks/
│       │   │   └── useLoroEditor.ts # Loro CRDT hook
│       │   ├── types/
│       │   │   └── editor.ts        # TypeScript types
│       │   └── styles/
│       │       └── editor.css       # Editor styles
│       ├── package.json
│       └── vite.config.ts           # Library build config
│
├── apps/
│   └── demo/                        # @hyper-text/demo (Demo app)
│       ├── src/
│       │   ├── components/
│       │   │   ├── PerformanceTestEditor.tsx
│       │   │   └── Sidebar.tsx
│       │   └── App.tsx
│       └── package.json
│
├── pnpm-workspace.yaml              # PNPM workspaces config
├── package.json                     # Root monorepo scripts
├── tsconfig.json                    # Root TypeScript config
└── README.md
```

## 📊 Bundle Size

| Package | Size (minified) | Size (gzipped) |
|---------|-----------------|----------------|
| `@hyper-text/editor` | ~45KB | ~15KB |

Run `pnpm analyze` to generate interactive bundle analysis.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Build the editor package first
pnpm build:editor

# Start the demo app
pnpm dev
```

### Available Scripts

```bash
pnpm dev              # Run demo app in dev mode
pnpm build            # Build all packages
pnpm build:editor     # Build editor package only
pnpm analyze          # Generate bundle size treemap
pnpm clean            # Clean all dist folders
```

## Using @hyper-text/editor

### Installation

```bash
pnpm add @hyper-text/editor
```

### Basic Usage

```tsx
import { Editor } from '@hyper-text/editor';
import '@hyper-text/editor/styles.css';

function App() {
  return <Editor showVirtualizationToggle showPreview />;
}
```

### With External State

```tsx
import { Editor, useLoroEditor } from '@hyper-text/editor';
import '@hyper-text/editor/styles.css';

function App() {
  const { content, updateContent } = useLoroEditor();
  
  return (
    <Editor
      externalContent={content}
      onContentChange={updateContent}
      enableVirtualization
    />
  );
}
```

### Editor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableVirtualization` | `boolean` | `false` | Enable virtualized rendering |
| `showVirtualizationToggle` | `boolean` | `false` | Show virtualization toggle |
| `showPreview` | `boolean` | `true` | Show HTML/Text/JSON preview |
| `externalContent` | `string` | - | Controlled content |
| `onContentChange` | `(html: string) => void` | - | Content change handler |

## TipTap Performance Comparison

We've built a **real-time benchmark tool** comparing HyperText vs TipTap:

```bash
pnpm dev
# Navigate to "vs TipTap" in the sidebar
```

**Results with 10,000 blocks:**
- **HyperText**: 60 FPS, 48 MB memory, 300 DOM nodes
- **TipTap**: 22 FPS, 580 MB memory, 30,000 DOM nodes

**HyperText is 2.7x faster and uses 12x less memory.** [See full comparison →](./TIPTAP_COMPARISON.md)

## Roadmap

- [x] Image upload/paste (just added!)
- [x] TipTap performance comparison tool
- [ ] Table support
- [ ] Markdown import/export
- [ ] Real-time collaboration server
- [ ] Browser extension
- [ ] Plugins API
- [ ] More AI integrations (OpenAI, Anthropic, Cohere)
- [ ] Mobile app (React Native)

## Why This Matters

**AI is changing how we create content.**

- ChatGPT generates 2,000+ words per response
- Claude can write 4,000+ word articles
- AI tools generate entire documents in seconds

**Traditional editors weren't built for this.**

HyperText was. Built for the AI era. Built for performance. Built for scale.

## License

MIT

## Contributing

Contributions welcome! Please open issues or submit pull requests.

---

Built with ❤️ for developers building AI-powered apps.
# hyper-text
