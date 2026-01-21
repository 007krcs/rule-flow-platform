import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export default function Card({ children, title }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      {children}
    </div>
  );
}
