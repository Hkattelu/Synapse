import React, { useState, useRef } from 'react';
import { visualSettingsManager, type VisualSettingsConfig } from '../../lib/settings/VisualSettingsManager';
import type { ItemProperties } from '../../lib/types';

interface VisualSettingsPanelProps {
  currentProperties: ItemProperties;
  onApplySettings: (properties: Partial<ItemProperties>) => void;
  className?: string;
}

export function VisualSettingsPanel({ 
  currentProperties, 
  onApplySettings, 
  className = '' 
}: VisualSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show message temporarily
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Save current settings as defaults
  const handleSaveAsDefaults = () => {
    try {
      visualSettingsManager.saveAsDefaults(currentProperties);
      showMessage('success', 'Settings saved as defaults!');
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    }
  };

  // Load saved defaults
  const handleLoadDefaults = () => {
    try {
      const defaults = visualSettingsManager.loadDefaults();
      onApplySettings(defaults);
      showMessage('success', 'Default settings loaded!');
    } catch (error) {
      showMessage('error', 'Failed to load defaults');
    }
  };

  // Reset to factory defaults
  const handleResetToFactory = () => {
    if (confirm('Are you sure you want to reset all visual settings to factory defaults? This cannot be undone.')) {
      try {
        const factoryDefaults = visualSettingsManager.resetToDefaults();
        onApplySettings(factoryDefaults);
        showMessage('success', 'Settings reset to factory defaults!');
      } catch (error) {
        showMessage('error', 'Failed to reset settings');
      }
    }
  };

  // Export settings
  const handleExportSettings = () => {
    try {
      const blob = visualSettingsManager.generateSettingsFile();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synapse-visual-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Settings exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export settings');
    }
  };

  // Import settings
  const handleImportSettings = async (file: File) => {
    setIsLoading(true);
    try {
      const config = await visualSettingsManager.parseSettingsFile(file);
      const result = await visualSettingsManager.importSettings(config);
      
      if (result.success) {
        // Apply imported defaults
        const defaults = visualSettingsManager.loadDefaults();
        onApplySettings(defaults);
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to import settings file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportSettings(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all custom settings
  const handleClearCustomSettings = () => {
    if (confirm('Are you sure you want to clear all custom themes, gradients, and settings? This cannot be undone.')) {
      try {
        visualSettingsManager.clearAllCustomSettings();
        const factoryDefaults = visualSettingsManager.resetToDefaults();
        onApplySettings(factoryDefaults);
        showMessage('success', 'All custom settings cleared!');
      } catch (error) {
        showMessage('error', 'Failed to clear custom settings');
      }
    }
  };

  // Get storage info
  const storageInfo = visualSettingsManager.getStorageInfo();

  if (!isExpanded) {
    return (
      <div className={`visual-settings-panel-compact ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between p-3 bg-background-tertiary hover:bg-background-secondary border border-border-subtle rounded transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-sm font-medium text-text-primary">Settings</span>
          </div>
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {message && (
          <div className={`mt-2 p-2 rounded text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`visual-settings-panel-expanded ${className}`}>
      <div className="border border-border-subtle rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-background-tertiary border-b border-border-subtle">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-sm font-medium text-text-primary">Visual Settings Management</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-text-secondary hover:text-text-primary p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Message */}
          {message && (
            <div className={`p-3 rounded text-sm ${
              message.type === 'success' 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-2">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveAsDefaults}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
              >
                Save as Defaults
              </button>
              <button
                onClick={handleLoadDefaults}
                className="p-2 bg-background-tertiary hover:bg-background-secondary border border-border-subtle rounded text-sm transition-colors"
              >
                Load Defaults
              </button>
            </div>
          </div>

          {/* Import/Export */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-2">Import/Export</h4>
            <div className="space-y-2">
              <button
                onClick={handleExportSettings}
                className="w-full p-2 bg-background-tertiary hover:bg-background-secondary border border-border-subtle rounded text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Settings</span>
              </button>
              
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                <button
                  className="w-full p-2 bg-background-tertiary hover:bg-background-secondary border border-border-subtle rounded text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isLoading ? 'Importing...' : 'Import Settings'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset Options */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-2">Reset Options</h4>
            <div className="space-y-2">
              <button
                onClick={handleResetToFactory}
                className="w-full p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
              >
                Reset to Factory Defaults
              </button>
              <button
                onClick={handleClearCustomSettings}
                className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Clear All Custom Settings
              </button>
            </div>
          </div>

          {/* Storage Info */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-2">Storage Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Used: {(storageInfo.used / 1024).toFixed(1)} KB</span>
                <span>{storageInfo.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                />
              </div>
              {storageInfo.percentage > 80 && (
                <p className="text-xs text-yellow-500">
                  Storage is getting full. Consider clearing custom settings.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}