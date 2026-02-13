import React, { useId } from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  type = 'text',
}) => {
  const inputId = useId();

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-[#cbb26a] mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-[#cbb26a] placeholder-gray-400 dark:placeholder-[#cbb26a]/50 focus:ring-2 focus:ring-[#c99d28] focus:border-[#c99d28] transition disabled:bg-gray-100 dark:disabled:bg-black/50 disabled:cursor-not-allowed"
      />
    </div>
  );
};
