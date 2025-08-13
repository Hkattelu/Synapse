// Custom hooks for project management operations

import { useAppDispatch, useAppState } from '../state/context';
import { ProjectManager, uploadProjectFile } from './projectManager';
import type { Project } from './types';

export function useProjectManager() {
  const dispatch = useAppDispatch();
  const state = useAppState();

  const createProject = async (name: string): Promise<void> => {
    dispatch({ type: 'CREATE_PROJECT', payload: { name } });
    // The new project will be auto-saved by the context
  };

  const loadProject = async (projectId: string): Promise<void> => {
    try {
      const storedProject = ProjectManager.loadProjectById(projectId);
      if (storedProject) {
        dispatch({ type: 'LOAD_PROJECT', payload: storedProject.project });
        // Update the projects list to reflect the new last opened time
        const projects = await ProjectManager.getAllProjects();
        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  };

  const saveCurrentProject = async (): Promise<boolean> => {
    if (!state.project) return false;
    
    try {
      const success = await ProjectManager.saveProject(state.project);
      if (success) {
        dispatch({ type: 'SAVE_PROJECT' });
        // Refresh projects list
        const projects = await ProjectManager.getAllProjects();
        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
      }
      return success;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const success = await ProjectManager.deleteProject(projectId);
      if (success) {
        dispatch({ type: 'DELETE_PROJECT', payload: projectId });
      }
      return success;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  };

  const duplicateProject = async (projectId: string): Promise<Project | null> => {
    try {
      const originalProject = state.projects.find(p => p.project.id === projectId)?.project;
      if (!originalProject) return null;

      const duplicatedProject = await ProjectManager.duplicateProject(originalProject);
      dispatch({ type: 'DUPLICATE_PROJECT', payload: projectId });
      
      return duplicatedProject;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      return null;
    }
  };

  const renameProject = async (projectId: string, newName: string): Promise<boolean> => {
    try {
      // Update in ProjectManager
      const storedProject = ProjectManager.loadProjectById(projectId);
      if (!storedProject) return false;

      const updatedProject = {
        ...storedProject.project,
        name: newName,
        updatedAt: new Date(),
      };

      const success = await ProjectManager.saveProject(updatedProject);
      if (success) {
        dispatch({ type: 'RENAME_PROJECT', payload: { id: projectId, name: newName } });
        // Refresh projects list
        const projects = await ProjectManager.getAllProjects();
        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to rename project:', error);
      return false;
    }
  };

  const exportProject = (projectId?: string): void => {
    const projectToExport = projectId 
      ? state.projects.find(p => p.project.id === projectId)?.project
      : state.project;
    
    if (projectToExport) {
      dispatch({ type: 'EXPORT_PROJECT', payload: projectToExport.id });
    }
  };

  const importProject = async (): Promise<Project | null> => {
    try {
      const importedProject = await uploadProjectFile();
      
      // Save the imported project
      const success = await ProjectManager.saveProject(importedProject);
      if (success) {
        dispatch({ type: 'IMPORT_PROJECT', payload: importedProject });
        // Refresh projects list
        const projects = await ProjectManager.getAllProjects();
        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
        return importedProject;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  };

  const switchToProject = async (projectId: string): Promise<void> => {
    // Save current project if dirty
    if (state.isDirty && state.project) {
      await saveCurrentProject();
    }
    
    dispatch({ type: 'SWITCH_PROJECT', payload: projectId });
  };

  const getProjectStats = (projectId?: string) => {
    const project = projectId 
      ? state.projects.find(p => p.project.id === projectId)?.project
      : state.project;
    
    if (project) {
      return ProjectManager.getProjectStats(project);
    }
    
    return null;
  };

  const refreshProjectsList = async (): Promise<void> => {
    try {
      const projects = await ProjectManager.getAllProjects();
      dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
    } catch (error) {
      console.error('Failed to refresh projects list:', error);
    }
  };

  return {
    // State
    projects: state.projects,
    currentProject: state.project,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    lastSaved: state.lastSaved,
    
    // Operations
    createProject,
    loadProject,
    saveCurrentProject,
    deleteProject,
    duplicateProject,
    renameProject,
    exportProject,
    importProject,
    switchToProject,
    getProjectStats,
    refreshProjectsList,
  };
}

// Hook for project statistics
export function useProjectStats(projectId?: string) {
  const { getProjectStats } = useProjectManager();
  return getProjectStats(projectId);
}

// Hook to check if current project needs saving
export function useProjectSaveStatus() {
  const state = useAppState();
  const { saveCurrentProject } = useProjectManager();
  
  return {
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    hasUnsavedChanges: state.isDirty && state.project !== null,
    save: saveCurrentProject,
  };
}
