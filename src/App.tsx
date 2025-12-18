import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RichTextEditor from './components/RichTextEditor';
import { PerformanceTest } from './components/PerformanceTest';
import { Activity, FileText } from 'lucide-react';

const queryClient = new QueryClient();

type Page = 'editor' | 'performance';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('editor');

  return (
    <QueryClientProvider client={queryClient}>
      {currentPage === 'editor' ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8">
          <div className="container mx-auto px-4">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                HyperText Editor
              </h1>
              <p className="text-gray-600">
                A collaborative rich text editor powered by Loro CRDT and TanStack
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setCurrentPage('editor')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
                >
                  <FileText size={18} />
                  Editor
                </button>
                <button
                  onClick={() => setCurrentPage('performance')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <Activity size={18} />
                  Performance Test
                </button>
              </div>
            </header>

            <RichTextEditor />

            <footer className="mt-12 text-center text-sm text-gray-500">
              <p>Built with React, Loro CRDT, TanStack, and Tailwind CSS</p>
            </footer>
          </div>
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <button
                onClick={() => setCurrentPage('editor')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                ← Back to Editor
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage('editor')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText size={18} />
                  Editor
                </button>
                <button
                  onClick={() => setCurrentPage('performance')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Activity size={18} />
                  Performance Test
                </button>
              </div>
            </div>
          </div>
          <PerformanceTest />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
