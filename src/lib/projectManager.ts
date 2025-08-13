import type { Project } from './types';
import { validateProject } from './validation';

// Project storage interface
export interface StoredProject {
  project: Project;
  lastOpened: Date;
}

// Project manager class for handling multiple projects
export class ProjectManager {
  private static readonly STORAGE_PREFIX = 'synapse-project-';
  private static readonly PROJECTS_LIST_KEY = 'synapse-projects-list';
  private static readonly CURRENT_PROJECT_KEY = 'synapse-current-project';

  // Get list of all saved projects
  static async getAllProjects(): Promise<StoredProject[]> {
    try {
      const projectsList = localStorage.getItem(this.PROJECTS_LIST_KEY);
      if (!projectsList) {
        return [];
      }

      const projectIds: string[] = JSON.parse(projectsList);
      const projects: StoredProject[] = [];

      for (const id of projectIds) {
        const storedProject = this.loadProjectById(id);
        if (storedProject) {
          projects.push(storedProject);
        }
      }

      // Sort by last opened date (most recent first)
      return projects.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime());
    } catch (error) {
      console.error('Failed to load projects list:', error);
      return [];
    }
  }

  // Save a project
  static async saveProject(project: Project): Promise<boolean> {
    try {
      // Validate project before saving
      const validation = validateProject(project);
      if (!validation.isValid) {
        console.error('Invalid project data:', validation.errors);
        return false;
      }

      // Update project metadata
      const updatedProject: Project = {
        ...project,
        updatedAt: new Date(),
      };

      // Save the project data
      const storedProject: StoredProject = {
        project: updatedProject,
        lastOpened: new Date(),
      };

      const serializedProject = this.serializeProject(storedProject);
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${project.id}`,
        serializedProject
      );

      // Update projects list
      await this.updateProjectsList(project.id);

      // Set as current project
      localStorage.setItem(this.CURRENT_PROJECT_KEY, project.id);

      console.log(`Project "${project.name}" saved successfully`);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  // Load a project by ID
  static loadProjectById(id: string): StoredProject | null {
    try {
      const serializedProject = localStorage.getItem(`${this.STORAGE_PREFIX}${id}`);
      if (!serializedProject) {
        return null;
      }

      return this.deserializeProject(serializedProject);
    } catch (error) {
      console.error(`Failed to load project ${id}:`, error);
      return null;
    }
  }

  // Load the current project
  static getCurrentProject(): StoredProject | null {
    try {
      const currentProjectId = localStorage.getItem(this.CURRENT_PROJECT_KEY);
      if (!currentProjectId) {
        return null;
      }

      const storedProject = this.loadProjectById(currentProjectId);
      if (storedProject) {
        // Update last opened time
        storedProject.lastOpened = new Date();
        this.saveProject(storedProject.project);
      }

      return storedProject;
    } catch (error) {
      console.error('Failed to load current project:', error);
      return null;
    }
  }

  // Delete a project
  static async deleteProject(id: string): Promise<boolean> {
    try {
      // Remove from storage
      localStorage.removeItem(`${this.STORAGE_PREFIX}${id}`);

      // Remove from projects list
      const projectsList = localStorage.getItem(this.PROJECTS_LIST_KEY);
      if (projectsList) {
        const projectIds: string[] = JSON.parse(projectsList);
        const updatedIds = projectIds.filter(projectId => projectId !== id);
        localStorage.setItem(this.PROJECTS_LIST_KEY, JSON.stringify(updatedIds));
      }

      // Clear current project if it was the deleted one
      const currentProjectId = localStorage.getItem(this.CURRENT_PROJECT_KEY);
      if (currentProjectId === id) {
        localStorage.removeItem(this.CURRENT_PROJECT_KEY);
      }

      console.log(`Project ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  // Export project to JSON
  static exportProject(project: Project): string {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        project: this.serializeProjectData(project),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export project:', error);
      throw new Error('Failed to export project');
    }
  }

  // Import project from JSON
  static importProject(jsonData: string): Project {
    try {
      const importData = JSON.parse(jsonData);

      // Validate import format
      if (!importData.project || !importData.version) {
        throw new Error('Invalid project file format');
      }

      // Deserialize project data
      const project = this.deserializeProjectData(importData.project);

      // Generate new ID and update metadata for imported project
      const importedProject: Project = {
        ...project,
        id: this.generateId(),
        name: `${project.name} (Imported)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate imported project
      const validation = validateProject(importedProject);
      if (!validation.isValid) {
        throw new Error(`Invalid project data: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      return importedProject;
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error('Failed to import project: ' + (error as Error).message);
    }
  }

  // Duplicate a project
  static async duplicateProject(originalProject: Project): Promise<Project> {
    try {
      const duplicatedProject: Project = {
        ...originalProject,
        id: this.generateId(),
        name: `${originalProject.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Deep clone timeline and media assets to avoid references
        timeline: originalProject.timeline.map(item => ({ ...item, id: this.generateId() })),
        mediaAssets: originalProject.mediaAssets.map(asset => ({ 
          ...asset, 
          id: this.generateId(),
          createdAt: new Date(),
        })),
      };

      const success = await this.saveProject(duplicatedProject);
      if (!success) {
        throw new Error('Failed to save duplicated project');
      }

      return duplicatedProject;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw new Error('Failed to duplicate project');
    }
  }

  // Get project statistics
  static getProjectStats(project: Project) {
    const totalDuration = project.timeline.reduce((sum, item) => sum + item.duration, 0);
    const assetsByType = project.mediaAssets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClips: project.timeline.length,
      totalAssets: project.mediaAssets.length,
      totalDuration: Math.round(totalDuration * 10) / 10,
      assetsByType,
      lastModified: project.updatedAt,
    };
  }

  // Private helper methods

  private static serializeProject(storedProject: StoredProject): string {
    return JSON.stringify({
      project: this.serializeProjectData(storedProject.project),
      lastOpened: storedProject.lastOpened.toISOString(),
    });
  }

  private static deserializeProject(serializedData: string): StoredProject {
    const data = JSON.parse(serializedData);
    return {
      project: this.deserializeProjectData(data.project),
      lastOpened: new Date(data.lastOpened),
    };
  }

  private static serializeProjectData(project: Project): any {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      mediaAssets: project.mediaAssets.map(asset => ({
        ...asset,
        createdAt: asset.createdAt.toISOString(),
      })),
    };
  }

  private static deserializeProjectData(data: any): Project {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      mediaAssets: data.mediaAssets.map((asset: any) => ({
        ...asset,
        createdAt: new Date(asset.createdAt),
      })),
    };
  }

  private static async updateProjectsList(projectId: string): Promise<void> {
    const projectsList = localStorage.getItem(this.PROJECTS_LIST_KEY);
    let projectIds: string[] = projectsList ? JSON.parse(projectsList) : [];

    if (!projectIds.includes(projectId)) {
      projectIds.push(projectId);
      localStorage.setItem(this.PROJECTS_LIST_KEY, JSON.stringify(projectIds));
    }
  }

  private static generateId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility functions for file operations
export function downloadProjectFile(project: Project): void {
  try {
    const jsonData = ProjectManager.exportProject(project);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.synapse`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download project file:', error);
    throw new Error('Failed to download project file');
  }
}

export function uploadProjectFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.synapse,.json';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const project = ProjectManager.importProject(text);
        resolve(project);
      } catch (error) {
        reject(error);
      }
    };
    
    input.click();
  });
}
