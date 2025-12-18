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

## Project Structure

```
hyper-text/
├── src/
│   ├── components/
│   │   ├── RichTextEditor.tsx       # Main editor
│   │   ├── VirtualizedEditor.tsx    # Virtualized version
│   │   ├── PerformanceTest.tsx      # Benchmark lab
│   │   ├── Toolbar.tsx              # Google Docs toolbar
│   │   ├── HeadingSelector.tsx      # Heading dropdown
│   │   ├── ColorPicker.tsx          # Text/highlight colors
│   │   └── Preview.tsx              # HTML/Text/JSON preview
│   ├── hooks/
│   │   └── useLoroEditor.ts         # Loro CRDT hook
│   ├── types/
│   │   └── editor.ts                # TypeScript types
│   ├── App.tsx                      # Main app
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── vite.config.ts                   # Vite + WASM config
├── tailwind.config.js               # Tailwind v4 config
└── package.json
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Roadmap

- [ ] Table support
- [ ] Image upload/paste
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
