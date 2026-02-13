import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  disabled = false,
  primary = false,
  className = '',
  type = 'button'
}) => {
  const baseClass = primary
    ? 'bg-gradient-to-r from-[#c9a227] to-[#6d4c9b] text-white hover:from-[#d8b75a] hover:to-[#8b6fb5] disabled:opacity-50'
    : 'bg-gray-200 text-[#3d2b0b] hover:bg-gray-300 dark:bg-gray-800 dark:text-[#cbb26a] dark:hover:bg-gray-700 disabled:opacity-50';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold transition inline-flex items-center justify-center gap-2 ${baseClass} ${className}`}
    >
      {children}
    </button>
  );
};
