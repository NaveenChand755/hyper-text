import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface HeadingSelectorProps {
  onSelect: (heading: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => void;
  currentHeading?: string;
}

const HEADING_OPTIONS = [
  { value: 'p', label: 'Normal text', preview: 'Paragraph', fontSize: '1em' },
  { value: 'h1', label: 'Heading 1', preview: 'Heading 1', fontSize: '2em' },
  { value: 'h2', label: 'Heading 2', preview: 'Heading 2', fontSize: '1.5em' },
  { value: 'h3', label: 'Heading 3', preview: 'Heading 3', fontSize: '1.17em' },
  { value: 'h4', label: 'Heading 4', preview: 'Heading 4', fontSize: '1em' },
  { value: 'h5', label: 'Heading 5', preview: 'Heading 5', fontSize: '0.83em' },
  { value: 'h6', label: 'Heading 6', preview: 'Heading 6', fontSize: '0.67em' },
] as const;

export const HeadingSelector: React.FC<HeadingSelectorProps> = ({ onSelect, currentHeading = 'p' }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (value: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    onSelect(value);
    setIsOpen(false);
  };

  const currentOption = HEADING_OPTIONS.find(opt => opt.value === currentHeading) || HEADING_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1.5 rounded transition-all duration-150 ease-in-out border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 min-w-[140px] justify-between"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        title="Select text style"
      >
        <span className="text-sm font-medium">{currentOption.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[220px]">
          {HEADING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-2 transition-colors hover:bg-blue-50 ${
                currentHeading === option.value ? 'bg-blue-100' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option.value as 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
              }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="font-semibold"
                  style={{
                    fontSize: option.fontSize,
                    lineHeight: '1.2',
                  }}
                >
                  {option.preview}
                </span>
                <span className="text-xs text-gray-500 ml-auto">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
