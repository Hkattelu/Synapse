import React from 'react';
import { motion } from 'framer-motion';
import { useUI } from '../state/hooks';
import { Layers, Settings } from 'lucide-react';

interface UIModeToggleProps {
  className?: string;
}

export function UIModeToggle({ className = '' }: UIModeToggleProps) {
  const { ui, setUIMode } = useUI();

  const handleModeChange = (mode: 'simplified' | 'advanced') => {
    setUIMode(mode);
    
    // Persist user preference to localStorage
    try {
      localStorage.setItem('synapse-ui-mode', mode);
    } catch (error) {
      console.warn('Failed to save UI mode preference:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
        <motion.div
          className="absolute inset-1 bg-white rounded-lg shadow-sm"
          initial={false}
          animate={{
            x: ui.mode === 'simplified' ? 0 : '100%',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{
            width: 'calc(50% - 2px)',
          }}
        />
        
        <div className="relative flex">
          <button
            onClick={() => handleModeChange('simplified')}
            className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              ui.mode === 'simplified'
                ? 'text-purple-600'
                : 'text-white/70 hover:text-white'
            }`}
            title="Simplified Mode - Streamlined interface for educational content"
          >
            <Layers className="w-4 h-4" />
            <span>Simplified</span>
          </button>
          
          <button
            onClick={() => handleModeChange('advanced')}
            className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              ui.mode === 'advanced'
                ? 'text-purple-600'
                : 'text-white/70 hover:text-white'
            }`}
            title="Advanced Mode - Full feature access with detailed controls"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced</span>
          </button>
        </div>
      </div>
    </div>
  );
}