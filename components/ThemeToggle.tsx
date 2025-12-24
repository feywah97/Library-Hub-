
import React from 'react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1 w-20 lg:w-24 h-9 lg:h-11 transition-all shadow-inner border border-slate-200 dark:border-slate-800"
      aria-label="Toggle Bright/Dark Mode"
    >
      <div
        className={`absolute w-7 lg:w-9 h-7 lg:h-9 rounded-full bg-white dark:bg-emerald-600 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDarkMode ? 'translate-x-11 lg:translate-x-12' : 'translate-x-0'
        }`}
      >
        {isDarkMode ? (
          <svg className="h-4 w-4 lg:h-5 lg:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
        )}
      </div>
      <div className="flex w-full justify-between px-2 text-[8px] lg:text-[10px] font-black uppercase tracking-tighter select-none">
        <span className={`${isDarkMode ? 'opacity-30' : 'opacity-100 text-slate-500'} ml-0.5`}>Bright</span>
        <span className={`${isDarkMode ? 'opacity-100 text-emerald-400' : 'opacity-30'} mr-0.5`}>Dark</span>
      </div>
    </button>
  );
};

export default ThemeToggle;