import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-inner">
        {isDark ? (
          // Sun icon for light mode
          <svg className="theme-icon" viewBox="0 0 24 24">
            <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16M11,1V3H13V1H11M4.22,4.22L5.64,5.64L4.22,4.22M19.78,4.22L18.36,5.64L19.78,4.22M12,5A7,7 0 0,0 5,12H3A9,9 0 0,1 12,3V5M1,12H3V12H1M21,12H23V12H21M4.22,19.78L5.64,18.36L4.22,19.78M19.78,19.78L18.36,18.36L19.78,19.78M11,23H13V21H11V23M12,19A7,7 0 0,0 19,12H21A9,9 0 0,1 12,21V19Z" />
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg className="theme-icon" viewBox="0 0 24 24">
            <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.95 20.77,15.4 21.42,14.75C22.07,14.1 22.62,13.13 22.62,12.3C22.62,11.47 22.07,10.5 21.42,9.85C20.77,9.2 19.8,8.65 18.97,8.65C18.14,8.65 17.17,9.2 16.52,9.85C15.87,10.5 15.32,11.47 15.32,12.3C15.32,13.13 15.87,14.1 16.52,14.75C17.17,15.4 18.14,15.95 18.97,15.95M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
          </svg>
        )}
        <span className="theme-toggle-text">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
