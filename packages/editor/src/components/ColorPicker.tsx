import React, { useState, useRef, useEffect } from 'react';
import { Palette, Highlighter } from 'lucide-react';

interface ColorPickerProps {
  type: 'text' | 'highlight';
  onColorSelect: (color: string) => void;
  currentColor?: string;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#FFFFFF', // White
  '#FFD700', // Gold
  '#4B0082', // Indigo
  '#00CED1', // Dark Turquoise
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ type, onColorSelect, currentColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorClick = (color: string) => {
    onColorSelect(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorSelect(color);
  };

  const Icon = type === 'text' ? Palette : Highlighter;
  const title = type === 'text' ? 'Text color' : 'Highlight color';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center justify-center w-8 h-8 rounded transition-all duration-150 ease-in-out border border-transparent bg-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 active:bg-blue-100 active:border-blue-400"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        title={title}
      >
        <Icon size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 w-64">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              {type === 'text' ? 'Text Color' : 'Highlight Color'}
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    currentColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleColorClick(color);
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Custom Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setCustomColor(value);
                    if (value.length === 7) {
                      onColorSelect(value);
                    }
                  }
                }}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>

          {type === 'highlight' && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleColorClick('transparent');
                }}
              >
                Remove Highlight
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
