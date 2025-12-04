import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon: Icon,
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-lg dark:shadow-none",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-300 bg-transparent dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300",
    ghost: "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
};

// --- Input Field ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input 
      className={`w-full px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-700 dark:text-white ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// --- Textarea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <textarea 
      className={`w-full px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-700 dark:text-white ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);