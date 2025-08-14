import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { 
  ExportState, 
  ExportSettings, 
  ExportJob, 
  ExportProgress, 
  ExportPreset,
  Project 
} from '../lib/types';
import { 
  exportManager, 
  DEFAULT_EXPORT_PRESETS, 
  getDefaultExportSettings,
  type ProgressCallback 
} from '../lib/exportManager';

// Export actions
type ExportAction =
  | { type: 'SET_EXPORT_SETTINGS'; payload: ExportSettings }
  | { type: 'SET_EXPORT_PRESETS'; payload: ExportPreset[] }
  | { type: 'START_EXPORT'; payload: ExportJob }
  | { type: 'UPDATE_PROGRESS'; payload: ExportProgress }
  | { type: 'COMPLETE_EXPORT'; payload: { job: ExportJob; outputPath: string } }
  | { type: 'FAIL_EXPORT'; payload: { job: ExportJob; error: string } }
  | { type: 'CANCEL_EXPORT'; payload: ExportJob }
  | { type: 'ADD_TO_HISTORY'; payload: ExportJob }
  | { type: 'CLEAR_CURRENT_JOB' };

// Initial export state
const createInitialState = (): ExportState => ({
  isExporting: false,
  currentJob: undefined,
  exportHistory: [],
  availablePresets: DEFAULT_EXPORT_PRESETS,
  exportSettings: {
    format: 'mp4',
    codec: 'h264',
    quality: 'high',
    audioCodec: 'aac',
    audioBitrate: 128,
    audioSampleRate: 48000,
    enableHardwareAcceleration: true,
    enableMultithreading: true,
    concurrency: 4,
  },
});

// Export reducer
const exportReducer = (state: ExportState, action: ExportAction): ExportState => {
  switch (action.type) {
    case 'SET_EXPORT_SETTINGS':
      return {
        ...state,
        exportSettings: action.payload,
      };

    case 'SET_EXPORT_PRESETS':
      return {
        ...state,
        availablePresets: action.payload,
      };

    case 'START_EXPORT':
      return {
        ...state,
        isExporting: true,
        currentJob: action.payload,
      };

    case 'UPDATE_PROGRESS':
      if (!state.currentJob) return state;
      
      return {
        ...state,
        currentJob: {
          ...state.currentJob,
          progress: action.payload,
        },
      };

    case 'COMPLETE_EXPORT':
      return {
        ...state,
        isExporting: false,
        currentJob: action.payload.job,
        exportHistory: [action.payload.job, ...state.exportHistory],
      };

    case 'FAIL_EXPORT':
      return {
        ...state,
        isExporting: false,
        currentJob: action.payload.job,
        exportHistory: [action.payload.job, ...state.exportHistory],
      };

    case 'CANCEL_EXPORT':
      return {
        ...state,
        isExporting: false,
        currentJob: action.payload,
        exportHistory: [action.payload, ...state.exportHistory],
      };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        exportHistory: [action.payload, ...state.exportHistory],
      };

    case 'CLEAR_CURRENT_JOB':
      return {
        ...state,
        currentJob: undefined,
      };

    default:
      return state;
  }
};

// Export context
interface ExportContextType {
  state: ExportState;
  
  // Settings management
  setExportSettings: (settings: ExportSettings) => void;
  updateExportSettings: (updates: Partial<ExportSettings>) => void;
  applyPreset: (preset: ExportPreset) => void;
  
  // Export operations
  startExport: (project: Project, settings?: ExportSettings) => Promise<string>;
  cancelExport: () => void;
  
  // Progress tracking
  clearCurrentJob: () => void;
  
  // Utility functions
  getEstimatedFileSize: (project: Project, settings?: ExportSettings) => number;
  canStartExport: () => boolean;
}

const ExportContext = createContext<ExportContextType | null>(null);

// Export provider component
interface ExportProviderProps {
  children: React.ReactNode;
}

export const ExportProvider: React.FC<ExportProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(exportReducer, createInitialState());

  // Progress callback handler
  const handleProgress: ProgressCallback = useCallback((progress: ExportProgress) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  }, []);

  // Set up progress callback when component mounts
  useEffect(() => {
    exportManager.setProgressCallback(handleProgress);
    
    return () => {
      exportManager.setProgressCallback(null);
    };
  }, [handleProgress]);

  // Settings management
  const setExportSettings = useCallback((settings: ExportSettings) => {
    dispatch({ type: 'SET_EXPORT_SETTINGS', payload: settings });
  }, []);

  const updateExportSettings = useCallback((updates: Partial<ExportSettings>) => {
    dispatch({ 
      type: 'SET_EXPORT_SETTINGS', 
      payload: { ...state.exportSettings, ...updates } 
    });
  }, [state.exportSettings]);

  const applyPreset = useCallback((preset: ExportPreset) => {
    const newSettings = { ...state.exportSettings, ...preset.settings };
    dispatch({ type: 'SET_EXPORT_SETTINGS', payload: newSettings });
  }, [state.exportSettings]);

  // Export operations
  const startExport = useCallback(async (
    project: Project, 
    settings?: ExportSettings
  ): Promise<string> => {
    if (state.isExporting) {
      throw new Error('Export already in progress');
    }

    // Use provided settings or current state settings
    const exportSettings = settings || state.exportSettings;
    
    // Apply project defaults if not overridden
    const finalSettings = {
      ...getDefaultExportSettings(project),
      ...exportSettings,
    };

    try {
      // Create and start the job
      const job: ExportJob = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: project.id,
        projectName: project.name,
        settings: finalSettings,
        progress: { status: 'idle', progress: 0 },
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      };

      dispatch({ type: 'START_EXPORT', payload: job });

      // Start the actual export process
      const outputPath = await exportManager.startExport(project, finalSettings);

      // Get the completed job from export manager
      const completedJob = exportManager.getCurrentJob();
      if (completedJob) {
        dispatch({ 
          type: 'COMPLETE_EXPORT', 
          payload: { job: completedJob, outputPath } 
        });
      }

      return outputPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Get the failed job from export manager
      const failedJob = exportManager.getCurrentJob();
      if (failedJob) {
        dispatch({ 
          type: 'FAIL_EXPORT', 
          payload: { job: failedJob, error: errorMessage } 
        });
      }

      throw error;
    }
  }, [state.isExporting, state.exportSettings]);

  const cancelExport = useCallback(() => {
    if (!state.isExporting || !state.currentJob) {
      return;
    }

    exportManager.cancelExport();
    
    const cancelledJob = { 
      ...state.currentJob, 
      cancelledAt: new Date(),
      progress: { 
        ...state.currentJob.progress, 
        status: 'cancelled' as const 
      }
    };

    dispatch({ type: 'CANCEL_EXPORT', payload: cancelledJob });
  }, [state.isExporting, state.currentJob]);

  // Progress tracking
  const clearCurrentJob = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_JOB' });
  }, []);

  // Utility functions
  const getEstimatedFileSize = useCallback((
    project: Project, 
    settings?: ExportSettings
  ): number => {
    const exportSettings = settings || state.exportSettings;
    
    // Get quality settings
    const getQualityBitrate = (quality: string) => {
      switch (quality) {
        case 'low': return 1000;
        case 'medium': return 3000;
        case 'high': return 8000;
        case 'ultra': return 15000;
        default: return 8000;
      }
    };

    const videoBitrate = exportSettings.bitrate || getQualityBitrate(exportSettings.quality);
    const audioBitrate = exportSettings.audioBitrate || 128;
    const duration = project.settings.duration;
    
    // Calculate estimated file size in bytes
    const totalBitrate = videoBitrate + audioBitrate; // kbps
    const estimatedBytes = (totalBitrate * 1000 * duration) / 8;
    
    return Math.round(estimatedBytes);
  }, [state.exportSettings]);

  const canStartExport = useCallback(() => {
    return !state.isExporting;
  }, [state.isExporting]);

  const contextValue: ExportContextType = {
    state,
    
    // Settings management
    setExportSettings,
    updateExportSettings,
    applyPreset,
    
    // Export operations
    startExport,
    cancelExport,
    
    // Progress tracking
    clearCurrentJob,
    
    // Utility functions
    getEstimatedFileSize,
    canStartExport,
  };

  return (
    <ExportContext.Provider value={contextValue}>
      {children}
    </ExportContext.Provider>
  );
};

// Custom hook to use export context
export const useExport = (): ExportContextType => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};

// Convenience hook for export settings only
export const useExportSettings = () => {
  const { state, setExportSettings, updateExportSettings, applyPreset } = useExport();
  
  return {
    settings: state.exportSettings,
    presets: state.availablePresets,
    setSettings: setExportSettings,
    updateSettings: updateExportSettings,
    applyPreset,
  };
};

// Convenience hook for export status
export const useExportStatus = () => {
  const { state, canStartExport, clearCurrentJob } = useExport();
  
  return {
    isExporting: state.isExporting,
    currentJob: state.currentJob,
    progress: state.currentJob?.progress,
    canStartExport: canStartExport(),
    exportHistory: state.exportHistory,
    clearCurrentJob,
  };
};
