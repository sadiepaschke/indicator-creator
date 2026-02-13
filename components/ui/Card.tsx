import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
);
