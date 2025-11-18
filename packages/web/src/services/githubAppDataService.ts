/**
 * GitHub App Data Service
 *
 * Converts GitHub repository structure to AppRoot format for AppsCanvas
 */

import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface GitHubRepositoryInfo {
  repositoryName: string;
  owner: string;
  branch: string;
  repositoryUrl?: string;
  installationId?: number;
}

interface EntityInfo {
  name: string;
  version: string | null;
  path: string;
  content: {
    className?: string;
    fields?: Array<{ name: string; type: string }>;
    [key: string]: any;
  };
}

interface WorkflowInfo {
  name: string;
  version: string | null;
  path: string;
  content: any;
}

interface RequirementInfo {
  name: string;
  path: string;
  content?: string;
}

interface RepositoryStructure {
  repositoryName: string;
  branch: string;
  appType: 'python' | 'java';
  entities: EntityInfo[];
  workflows: WorkflowInfo[];
  requirements: RequirementInfo[];
}

export interface RepositoryDiff {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

/**
 * Load repository structure from GitHub via backend API
 */
export async function loadRepositoryStructure(
  repoInfo: GitHubRepositoryInfo,
  conversationId?: string
): Promise<RepositoryStructure> {
  const requestBody: any = conversationId
    ? { conversation_id: conversationId }
    : {
        repository_name: repoInfo.repositoryName,
        branch: repoInfo.branch,
        owner: repoInfo.owner,
      };

  // Include installation_id if provided (legacy mode only)
  if (!conversationId && repoInfo.installationId) {
    requestBody.installation_id = repoInfo.installationId;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/repository/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to load repository: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Load file content from GitHub
 */
export async function loadFileContent(
  repoInfo: GitHubRepositoryInfo,
  filePath: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/repository/file-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repository_name: repoInfo.repositoryName,
      file_path: filePath,
      branch: repoInfo.branch,
      owner: repoInfo.owner,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content;
}

/**
 * Convert GitHub repository structure to AppRoot format
 */
export async function convertGitHubToAppRoot(
  repoInfo: GitHubRepositoryInfo,
  conversationId?: string
): Promise<AppRoot> {
  const structure = await loadRepositoryStructure(repoInfo, conversationId);

  // Create app root
  const appRoot: AppRoot = {
    app: {
      id: `github-${repoInfo.owner}-${repoInfo.repositoryName}-${repoInfo.branch}`,
      name: structure.repositoryName,
      description: `GitHub repository: ${repoInfo.owner}/${repoInfo.repositoryName} (${repoInfo.branch})`,
      version: '1.0.0',
      type: structure.appType,
      metadata: {
        source: 'github',
        owner: repoInfo.owner,
        repository: repoInfo.repositoryName,
        branch: repoInfo.branch,
      },
      environments: [],
      entities: [],
      requirements: [],
    },
  };

  // Add default environment
  const envId = 'env-default';
  appRoot.app.environments.push({
    id: envId,
    name: 'Development',
    type: 'development',
    status: 'active',
    url: '',
    metadata: {},
  });

  // Convert entities
  structure.entities.forEach((entity, index) => {
    const versionStr = entity.version || 'version_1';
    const entityId = `entity-${entity.name.toLowerCase()}-${versionStr}`;

    // Extract fields from entity content
    const fields = entity.content.fields || [];
    const className = entity.content.className || entity.name;

    // Find workflows for this entity
    // Match workflows that:
    // 1. Have exact name match (case-insensitive)
    // 2. Start with entity name (e.g., "customerworkflow" for entity "customer")
    // 3. Have path containing the entity name
    const entityWorkflows = structure.workflows
      .filter(w => {
        const workflowNameLower = w.name.toLowerCase();
        const entityNameLower = entity.name.toLowerCase();
        const workflowPathLower = w.path.toLowerCase();

        return workflowNameLower === entityNameLower ||
               workflowNameLower.startsWith(entityNameLower) ||
               workflowPathLower.includes(`/${entityNameLower}/`) ||
               workflowPathLower.includes(`/${entityNameLower}workflow/`);
      })
      .map(w => ({
        name: w.name,
        description: w.content?.desc || w.content?.description || `Workflow for ${entity.name}`,
        cyoda_url: '',
        github_url: w.path,
        config: w.content || {
          states: {}
        }
      }));

    appRoot.app.entities.push({
      id: entityId,
      name: entity.name,
      version: versionStr,
      description: `Entity from ${entity.path}`,
      cyoda_url: '',
      github_url: entity.path,
      model: entity.content,
      workflows: entityWorkflows,
      fields: fields.map((f: any) => ({
        name: f.name,
        type: f.type,
        required: f.required || false,
      })),
      metadata: {
        filePath: entity.path,
        className: className,
        hasWorkflow: entityWorkflows.length > 0,
        content: entity.content,
      },
    });
  });

  // Convert requirements
  structure.requirements.forEach((req, index) => {
    const reqId = `req-${index + 1}`;

    appRoot.app.requirements.push({
      id: reqId,
      title: req.name,
      description: `Requirement from ${req.path}`,
      priority: 'medium',
      status: 'draft',
      content: req.content, // Include content from analyze endpoint
      metadata: {
        filePath: req.path,
        fileName: `${req.name}.md`,
      },
    });
  });

  return appRoot;
}

/**
 * Load workflow JSON from GitHub and convert to workflow structure
 */
export async function loadWorkflowFromGitHub(
  repoInfo: GitHubRepositoryInfo,
  workflowFilePath: string
): Promise<any> {
  const content = await loadFileContent(repoInfo, workflowFilePath);
  return JSON.parse(content);
}

/**
 * Get diff of uncommitted changes in a repository
 */
export async function getRepositoryDiff(
  repoInfo: GitHubRepositoryInfo
): Promise<RepositoryDiff> {
  const response = await fetch(`${API_BASE_URL}/api/v1/repository/diff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repository_name: repoInfo.repositoryName,
      owner: repoInfo.owner,
      branch: repoInfo.branch,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch repository diff');
  }

  return await response.json();
}

/**
 * Pull latest changes from remote repository
 */
export async function pullRepositoryChanges(
  conversationId: string
): Promise<{ success: boolean; message: string; branch: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/repository/pull`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to pull repository changes');
  }

  return await response.json();
}

const githubAppDataService = {
  loadRepositoryStructure,
  loadFileContent,
  convertGitHubToAppRoot,
  loadWorkflowFromGitHub,
  getRepositoryDiff,
};

export default githubAppDataService;

