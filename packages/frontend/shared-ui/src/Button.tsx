import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const className = variant === 'primary'
    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
    : 'bg-gray-200 text-gray-900 hover:bg-gray-300';
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
