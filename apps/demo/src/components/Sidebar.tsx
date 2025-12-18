import React from 'react';
import { FileText, Activity, Zap, Settings, Github, BookOpen, TrendingUp } from 'lucide-react';

type Page = 'editor' | 'performance' | 'comparison';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'editor' as Page, label: 'Editor', icon: FileText, description: 'Rich text editing' },
    { id: 'performance' as Page, label: 'Performance', icon: Activity, description: 'Stress testing' },
    { id: 'comparison' as Page, label: 'vs TipTap', icon: TrendingUp, description: 'Head-to-head FPS' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">HyperText</h1>
            <p className="text-xs text-gray-400">CRDT Editor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'} />
                  <div className="text-left">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className={`text-xs ${isActive ? 'text-blue-200' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Features Section */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-8">
          Features
        </p>
        <ul className="space-y-1">
          <li>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Real-time CRDT Sync</span>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs">Virtual Scrolling</span>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs">Rich Text Formatting</span>
            </div>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <a
            href="https://github.com/NaveenChand755/hyper-text"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <BookOpen size={16} />
            <span>Docs</span>
          </a>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={14} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-400">Powered by</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Loro CRDT</span>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">TanStack</span>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">React</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
