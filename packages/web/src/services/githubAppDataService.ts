/**
 * GitHub App Data Service
 *
 * Converts GitHub repository structure to AppRoot format for AppsCanvas
 */

import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';
import privateClient from '@/clients/private';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE?.replace('/api', '') || 'http://localhost:8000';

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
  content?: {
    className?: string;
    fields?: Array<{ name: string; type: string }>;
    [key: string]: any;
  };
  // Direct fields (from EntityResponse)
  className?: string;
  fields?: Array<{ name: string; type: string }>;
  hasWorkflow?: boolean;
}

interface WorkflowInfo {
  name: string;
  version: string | null;
  path: string;
  content?: any;
  entityName?: string;
}

interface RequirementInfo {
  name?: string;
  fileName?: string;
  path: string;
  filePath?: string;
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

  const { data } = await privateClient.post('/v1/repository/analyze', requestBody);
  return data;
}

/**
 * Load file content from GitHub
 */
export async function loadFileContent(
  repoInfo: GitHubRepositoryInfo,
  filePath: string
): Promise<string> {
  const { data } = await privateClient.post('/v1/repository/file-content', {
    repository_name: repoInfo.repositoryName,
    file_path: filePath,
    branch: repoInfo.branch,
    owner: repoInfo.owner,
  });

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

  console.log('📊 Repository structure loaded:', {
    entities: structure.entities?.length || 0,
    workflows: structure.workflows?.length || 0,
    requirements: structure.requirements?.length || 0,
    structure
  });

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

    // Extract fields from entity
    // Handle both formats:
    // 1. New format: entity.content (full JSON from /analyze)
    // 2. Old format: entity.fields (direct fields from EntityResponse)
    const entityContent = (entity as any).content;
    let fields = entityContent?.fields || (entity as any).fields || [];

    // Safety check: ensure fields is an array, convert object to array if needed
    if (!Array.isArray(fields)) {
      console.warn('⚠️ fields is not an array, converting:', { fields, type: typeof fields });
      if (typeof fields === 'object' && fields !== null) {
        // Convert object to array of field objects
        fields = Object.entries(fields).map(([key, value]: [string, any]) => ({
          name: key,
          type: value?.type || typeof value === 'string' ? value : 'string',
          required: value?.required || false,
        }));
      } else {
        fields = [];
      }
    }

    const className = entityContent?.className || (entity as any).className || entity.name;
    const description = entityContent?.description || `Entity from ${entity.path}`;

    console.log('📦 Converting entity:', {
      name: entity.name,
      hasContent: !!entityContent,
      contentKeys: entityContent ? Object.keys(entityContent) : [],
      fieldsCount: fields.length,
      fields: fields.map((f: any) => f.name),
      entityContent: entityContent
    });

    appRoot.app.entities.push({
      id: entityId,
      name: entity.name,
      version: versionStr,
      description: description,
      cyoda_url: '',
      github_url: entity.path,
      model: entityContent || entity,
      workflows: [],
      fields: fields.map((f: any) => ({
        name: f.name,
        type: f.type,
        required: f.required || false,
      })),
      metadata: {
        filePath: entity.path,
        className: className,
        hasWorkflow: false,
        content: entityContent || entity,
      },
    });
  });

  // Convert workflows and associate them with their entities
  structure.workflows.forEach((workflow: any) => {
    const workflowContent = workflow.content || {};
    const workflowName = workflow.name || workflowContent.name || 'UnknownWorkflow';
    const workflowId = `workflow-${workflowName.toLowerCase()}`;
    const entityName = workflow.entityName || workflow.entity_name;

    console.log('📋 Converting workflow:', {
      name: workflowName,
      entityName: entityName,
      hasContent: !!workflowContent,
      path: workflow.path || workflow.filePath
    });

    // Create workflow object - use content directly as config
    const workflowObj = {
      id: workflowId,
      name: workflowName,
      description: workflowContent.desc || workflowContent.description || `Workflow: ${workflowName}`,
      cyoda_url: '',
      github_url: workflow.filePath || workflow.path,
      config: workflowContent,
      content: workflowContent,
      metadata: {
        filePath: workflow.filePath || workflow.path,
        entity_name: entityName
      }
    };

    // Associate workflow with its entity
    if (entityName) {
      const entity = appRoot.app.entities.find(e =>
        e.name.toLowerCase() === entityName.toLowerCase()
      );

      if (entity) {
        console.log('✅ Associated workflow with entity:', {
          workflowName,
          entityName: entity.name
        });
        entity.workflows.push(workflowObj);
      } else {
        console.warn('⚠️ Entity not found for workflow:', {
          workflowName,
          entityName
        });
        // Store in metadata as fallback
        if (!appRoot.app.metadata) {
          appRoot.app.metadata = {};
        }
        if (!(appRoot.app.metadata as any).workflows) {
          (appRoot.app.metadata as any).workflows = [];
        }
        (appRoot.app.metadata as any).workflows.push(workflowObj);
      }
    } else {
      // No entity name, store in metadata
      if (!appRoot.app.metadata) {
        appRoot.app.metadata = {};
      }
      if (!(appRoot.app.metadata as any).workflows) {
        (appRoot.app.metadata as any).workflows = [];
      }
      (appRoot.app.metadata as any).workflows.push(workflowObj);
    }
  });

  // Convert requirements
  structure.requirements.forEach((req, index) => {
    const reqId = `req-${index + 1}`;
    // Handle both formats: name or fileName
    const reqName = (req as any).name || (req as any).fileName || `Requirement ${index + 1}`;
    const reqContent = (req as any).content || '';
    // Handle both formats: filePath (from /analyze) or path (from legacy)
    const reqPath = (req as any).filePath || req.path || '';
    const reqFileName = (req as any).fileName || reqName;

    console.log('📋 Converting requirement:', {
      name: reqName,
      fileName: reqFileName,
      hasContent: !!reqContent,
      contentLength: reqContent?.length || 0,
      path: reqPath
    });

    appRoot.app.requirements.push({
      id: reqId,
      title: reqName,
      description: `Requirement from ${reqPath}`,
      priority: 'medium',
      status: 'draft',
      content: reqContent, // Include content from analyze endpoint
      metadata: {
        filePath: reqPath,
        fileName: reqFileName,
      },
    });
  });

  console.log('✅ AppRoot conversion complete:', {
    entities: appRoot.app.entities?.length || 0,
    workflows: appRoot.app.entities?.reduce((sum: number, e: any) => sum + (e.workflows?.length || 0), 0) || 0,
    requirements: appRoot.app.requirements?.length || 0,
    appRoot
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
  const { data } = await privateClient.post('/v1/repository/diff', {
    repository_name: repoInfo.repositoryName,
    owner: repoInfo.owner,
    branch: repoInfo.branch,
  });

  return data;
}

/**
 * Pull latest changes from remote repository
 */
export async function pullRepositoryChanges(
  conversationId: string
): Promise<{ success: boolean; message: string; branch: string }> {
  const { data } = await privateClient.post('/v1/repository/pull', {
    conversation_id: conversationId,
  });

  return data;
}

const githubAppDataService = {
  loadRepositoryStructure,
  loadFileContent,
  convertGitHubToAppRoot,
  loadWorkflowFromGitHub,
  getRepositoryDiff,
  pullRepositoryChanges,
};

export default githubAppDataService;

