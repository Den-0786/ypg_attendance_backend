'use client';
import { useState } from 'react';

export default function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-3 py-2 text-sm font-medium text-white
          bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl
          whitespace-nowrap transition-all duration-200
          ${positionClasses[position]}
        `}>
          {content}
          <div className={`
            absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45
            ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
}
