import React, { useEffect, useRef } from 'react';
import { MentionUser } from '../types/editor';

interface MentionDropdownProps {
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  position: { top: number; left: number };
  query: string;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  selectedIndex,
  onSelect,
  position,
  query,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter users based on query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    // Scroll selected item into view
    if (dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="mention-dropdown"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '200px',
        zIndex: 1000,
      }}
    >
      {filteredUsers.map((user, index) => (
        <div
          key={user.id}
          className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(user)}
          style={{
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: index === selectedIndex ? '#eff6ff' : 'transparent',
            borderLeft: index === selectedIndex ? '3px solid #3b82f6' : '3px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          {!user.avatar && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: '14px', color: '#374151' }}>{user.name}</span>
        </div>
      ))}
    </div>
  );
};
