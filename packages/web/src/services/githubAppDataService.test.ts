import { describe, it, expect, beforeEach, vi } from 'vitest';
import githubAppDataService, {
  type GitHubRepositoryInfo,
  loadRepositoryStructure,
  loadFileContent,
  getRepositoryDiff,
  pullRepositoryChanges,
} from './githubAppDataService';
import privateClient from '@/clients/private';

// Mock dependencies
vi.mock('@/clients/private', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('githubAppDataService', () => {
  const mockRepoInfo: GitHubRepositoryInfo = {
    repositoryName: 'test-repo',
    owner: 'test-owner',
    branch: 'main',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadRepositoryStructure', () => {
    const mockStructure = {
      repositoryName: 'test-repo',
      branch: 'main',
      appType: 'python' as const,
      entities: [
        {
          name: 'User',
          version: '1',
          path: 'src/entities/User.py',
          className: 'User',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
          ],
        },
      ],
      workflows: [],
      requirements: [],
    };

    it('should load repository structure without conversation ID', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await loadRepositoryStructure(mockRepoInfo);

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/analyze', {
        repository_name: 'test-repo',
        branch: 'main',
        owner: 'test-owner',
      });
      expect(result).toEqual(mockStructure);
    });

    it('should load repository structure with conversation ID', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await loadRepositoryStructure(mockRepoInfo, 'conv-123');

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/analyze', {
        conversation_id: 'conv-123',
      });
      expect(result).toEqual(mockStructure);
    });

    it('should include installation ID when provided (legacy mode)', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const repoInfoWithInstallation = {
        ...mockRepoInfo,
        installationId: 12345,
      };

      await loadRepositoryStructure(repoInfoWithInstallation);

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/analyze', {
        repository_name: 'test-repo',
        branch: 'main',
        owner: 'test-owner',
        installation_id: 12345,
      });
    });

    it('should not include installation ID when conversation ID is provided', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const repoInfoWithInstallation = {
        ...mockRepoInfo,
        installationId: 12345,
      };

      await loadRepositoryStructure(repoInfoWithInstallation, 'conv-123');

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/analyze', {
        conversation_id: 'conv-123',
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Repository not found');
      vi.mocked(privateClient.post).mockRejectedValue(mockError);

      await expect(loadRepositoryStructure(mockRepoInfo)).rejects.toThrow(
        'Repository not found'
      );
    });
  });

  describe('loadFileContent', () => {
    it('should load file content from repository', async () => {
      const mockContent = 'file content here';
      vi.mocked(privateClient.post).mockResolvedValue({ data: { content: mockContent } });

      const result = await loadFileContent(mockRepoInfo, 'src/main.py');

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/file-content', {
        repository_name: 'test-repo',
        file_path: 'src/main.py',
        branch: 'main',
        owner: 'test-owner',
      });
      expect(result).toBe(mockContent);
    });

    it('should handle file not found errors', async () => {
      const mockError = new Error('File not found');
      vi.mocked(privateClient.post).mockRejectedValue(mockError);

      await expect(loadFileContent(mockRepoInfo, 'nonexistent.py')).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('getRepositoryDiff', () => {
    const mockDiff = {
      modified: ['src/main.py', 'src/utils.py'],
      added: ['src/new_file.py'],
      deleted: ['src/old_file.py'],
      untracked: ['temp.txt'],
    };

    it('should get repository diff', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockDiff });

      const result = await getRepositoryDiff(mockRepoInfo);

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/diff', {
        repository_name: 'test-repo',
        owner: 'test-owner',
        branch: 'main',
      });
      expect(result).toEqual(mockDiff);
    });

    it('should handle empty diff', async () => {
      const emptyDiff = {
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
      };
      vi.mocked(privateClient.post).mockResolvedValue({ data: emptyDiff });

      const result = await getRepositoryDiff(mockRepoInfo);

      expect(result).toEqual(emptyDiff);
      expect(result.modified).toHaveLength(0);
      expect(result.added).toHaveLength(0);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Git error');
      vi.mocked(privateClient.post).mockRejectedValue(mockError);

      await expect(getRepositoryDiff(mockRepoInfo)).rejects.toThrow('Git error');
    });
  });

  describe('pullRepositoryChanges', () => {
    const mockPullResponse = {
      success: true,
      message: 'Successfully pulled latest changes',
      branch: 'main',
    };

    it('should pull repository changes', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockPullResponse });

      const result = await pullRepositoryChanges('conv-123');

      expect(privateClient.post).toHaveBeenCalledWith('/v1/repository/pull', {
        conversation_id: 'conv-123',
      });
      expect(result).toEqual(mockPullResponse);
      expect(result.success).toBe(true);
    });

    it('should handle pull conflicts', async () => {
      const conflictResponse = {
        success: false,
        message: 'Pull failed: merge conflicts',
        branch: 'main',
      };
      vi.mocked(privateClient.post).mockResolvedValue({ data: conflictResponse });

      const result = await pullRepositoryChanges('conv-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('conflicts');
    });

    it('should handle errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(privateClient.post).mockRejectedValue(mockError);

      await expect(pullRepositoryChanges('conv-123')).rejects.toThrow('Network error');
    });
  });

  describe('convertGitHubToAppRoot', () => {
    const mockStructure = {
      repositoryName: 'test-repo',
      branch: 'main',
      appType: 'python' as const,
      entities: [
        {
          name: 'User',
          version: '1',
          path: 'src/entities/User.py',
          content: {
            className: 'User',
            description: 'User entity',
            fields: [
              { name: 'id', type: 'string', required: true },
              { name: 'name', type: 'string', required: true },
            ],
          },
        },
      ],
      workflows: [
        {
          name: 'CreateUser',
          version: '1',
          path: 'src/workflows/create_user.json',
          entityName: 'User',
          content: {
            name: 'CreateUser',
            desc: 'Create a new user',
            steps: [],
          },
        },
      ],
      requirements: [
        {
          fileName: 'requirements.txt',
          filePath: 'requirements.txt',
          content: 'flask==2.0.1\nsqlalchemy==1.4.0',
        },
      ],
    };

    it('should convert GitHub structure to AppRoot format', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      expect(result.app).toBeDefined();
      expect(result.app.name).toBe('test-repo');
      expect(result.app.type).toBe('python');
      expect(result.app.metadata?.source).toBe('github');
    });

    it('should convert entities correctly', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      expect(result.app.entities).toHaveLength(1);
      expect(result.app.entities[0].name).toBe('User');
      expect(result.app.entities[0].fields).toHaveLength(2);
      expect(result.app.entities[0].fields[0].name).toBe('id');
    });

    it('should associate workflows with entities', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      const userEntity = result.app.entities.find((e) => e.name === 'User');
      expect(userEntity).toBeDefined();
      expect(userEntity?.workflows).toHaveLength(1);
      expect(userEntity?.workflows[0].name).toBe('CreateUser');
    });

    it('should convert requirements correctly', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      expect(result.app.requirements).toHaveLength(1);
      expect(result.app.requirements[0].title).toBe('requirements.txt');
      expect(result.app.requirements[0].content).toContain('flask');
    });

    it('should create default environment', async () => {
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockStructure });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      expect(result.app.environments).toHaveLength(1);
      expect(result.app.environments[0].name).toBe('Development');
      expect(result.app.environments[0].type).toBe('development');
    });

    it('should handle entities without content field', async () => {
      const structureWithDirectFields = {
        ...mockStructure,
        entities: [
          {
            name: 'Product',
            version: '1',
            path: 'src/entities/Product.py',
            className: 'Product',
            fields: [{ name: 'id', type: 'string' }],
          },
        ],
      };
      vi.mocked(privateClient.post).mockResolvedValue({ data: structureWithDirectFields });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      expect(result.app.entities).toHaveLength(1);
      expect(result.app.entities[0].name).toBe('Product');
      expect(result.app.entities[0].fields).toHaveLength(1);
    });

    it('should handle workflows without entity association', async () => {
      const structureWithOrphanWorkflow = {
        ...mockStructure,
        workflows: [
          {
            name: 'GlobalWorkflow',
            version: '1',
            path: 'src/workflows/global.json',
            content: { name: 'GlobalWorkflow' },
          },
        ],
      };
      vi.mocked(privateClient.post).mockResolvedValue({
        data: structureWithOrphanWorkflow,
      });

      const result = await githubAppDataService.convertGitHubToAppRoot(mockRepoInfo);

      // Orphan workflows should be stored in metadata
      expect(result.app.metadata).toBeDefined();
      expect((result.app.metadata as any).workflows).toBeDefined();
      expect((result.app.metadata as any).workflows).toHaveLength(1);
    });
  });

  describe('default export', () => {
    it('should export all functions', () => {
      expect(githubAppDataService.loadRepositoryStructure).toBe(loadRepositoryStructure);
      expect(githubAppDataService.loadFileContent).toBe(loadFileContent);
      expect(githubAppDataService.getRepositoryDiff).toBe(getRepositoryDiff);
      expect(githubAppDataService.pullRepositoryChanges).toBe(pullRepositoryChanges);
      expect(githubAppDataService.convertGitHubToAppRoot).toBeDefined();
      expect(githubAppDataService.loadWorkflowFromGitHub).toBeDefined();
    });
  });
});
