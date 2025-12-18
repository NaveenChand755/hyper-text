import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Editor } from "@hyper-text/editor";
import { PerformanceTestEditor } from "./components/PerformanceTestEditor";
import { EditorComparison } from "./components/EditorComparison";
import { Sidebar } from "./components/Sidebar";
import "@hyper-text/editor/styles.css";

const queryClient = new QueryClient();

type Page = "editor" | "performance" | "comparison";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("editor");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <main className="flex-1 ml-64 overflow-hidden">
          {currentPage === "editor" ? (
            <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 py-8">
              <div className="container mx-auto px-4">
                <header className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    HyperText Editor
                  </h1>
                  <p className="text-gray-600">
                    A collaborative rich text editor powered by Loro CRDT and TanStack
                  </p>
                </header>

                <Editor showVirtualizationToggle />

                <footer className="mt-12 text-center text-sm text-gray-500">
                  <p>Built with React, Loro CRDT, TanStack, and Tailwind CSS</p>
                </footer>
              </div>
            </div>
          ) : currentPage === "performance" ? (
            <PerformanceTestEditor />
          ) : (
            <EditorComparison />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
