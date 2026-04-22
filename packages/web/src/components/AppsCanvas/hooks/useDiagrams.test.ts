import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiagrams } from './useDiagrams';
import type { DiagramsConfiguration, DiagramConfig } from '../types/diagrams';

describe('useDiagrams', () => {
  const mockDiagram: DiagramConfig = {
    id: 'diagram-1',
    name: 'Test Diagram',
    library: 'recharts',
    chartType: 'line',
    data: [{ name: 'A', value: 10 }],
    xAxisKey: 'name',
    yAxisKeys: ['value'],
  };

  const mockInitialConfig: DiagramsConfiguration = {
    version: '1.0.0',
    environments: [
      {
        environmentId: 'env-1',
        environmentName: 'Test Environment',
        diagrams: [mockDiagram],
      },
    ],
  };

  describe('initialization', () => {
    it('should initialize with default config when no initialConfig provided', () => {
      const { result } = renderHook(() => useDiagrams());

      expect(result.current.config).toEqual({
        version: '1.0.0',
        environments: [],
      });
    });

    it('should initialize with provided initialConfig', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      expect(result.current.config).toEqual(mockInitialConfig);
    });

    it('should generate diagramNodes from config', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      expect(result.current.diagramNodes).toHaveLength(1);
      expect(result.current.diagramNodes[0].id).toBe('diagram-diagram-1');
      expect(result.current.diagramNodes[0].type).toBe('diagramNode');
    });
  });

  describe('getDiagramsForEnv', () => {
    it('should return diagrams for a specific environment', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const nodes = result.current.getDiagramsForEnv('env-1');

      expect(nodes).toHaveLength(1);
      expect(nodes[0].data.diagram.id).toBe('diagram-1');
    });

    it('should return empty array for non-existent environment', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const nodes = result.current.getDiagramsForEnv('non-existent');

      expect(nodes).toHaveLength(0);
    });

    it('should apply basePosition when provided', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const basePosition = { x: 100, y: 200 };
      const nodes = result.current.getDiagramsForEnv('env-1', basePosition);

      expect(nodes[0].position.x).toBeGreaterThanOrEqual(basePosition.x);
      expect(nodes[0].position.y).toBeGreaterThanOrEqual(basePosition.y);
    });
  });

  describe('addDiagram', () => {
    it('should add diagram to existing environment', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      const newDiagram: DiagramConfig = {
        id: 'diagram-2',
        name: 'New Diagram',
        library: 'recharts',
        chartType: 'bar',
        data: [{ name: 'B', value: 20 }],
      };

      act(() => {
        result.current.addDiagram('env-1', newDiagram);
      });

      expect(result.current.config.environments[0].diagrams).toHaveLength(2);
      expect(result.current.config.environments[0].diagrams[1]).toEqual(newDiagram);
      expect(onConfigChange).toHaveBeenCalledTimes(1);
    });

    it('should create new environment when adding diagram to non-existent environment', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const newDiagram: DiagramConfig = {
        id: 'diagram-3',
        name: 'Another Diagram',
        library: 'recharts',
        chartType: 'pie',
        data: [{ name: 'C', value: 30 }],
      };

      act(() => {
        result.current.addDiagram('env-2', newDiagram);
      });

      expect(result.current.config.environments).toHaveLength(2);
      expect(result.current.config.environments[1].environmentId).toBe('env-2');
      expect(result.current.config.environments[1].diagrams[0]).toEqual(newDiagram);
    });
  });

  describe('removeDiagram', () => {
    it('should remove diagram from environment', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      act(() => {
        result.current.removeDiagram('env-1', 'diagram-1');
      });

      expect(result.current.config.environments[0].diagrams).toHaveLength(0);
      expect(onConfigChange).toHaveBeenCalledTimes(1);
    });

    it('should not modify config when removing from non-existent environment', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const configBefore = result.current.config;

      act(() => {
        result.current.removeDiagram('non-existent', 'diagram-1');
      });

      expect(result.current.config).toEqual(configBefore);
    });

    it('should not modify config when removing non-existent diagram', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const configBefore = result.current.config;

      act(() => {
        result.current.removeDiagram('env-1', 'non-existent-diagram');
      });

      expect(result.current.config.environments[0].diagrams).toHaveLength(1);
    });
  });

  describe('updateDiagram', () => {
    it('should update diagram properties', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      const updates = { name: 'Updated Diagram Name' };

      act(() => {
        result.current.updateDiagram('env-1', 'diagram-1', updates);
      });

      expect(result.current.config.environments[0].diagrams[0].name).toBe('Updated Diagram Name');
      expect(onConfigChange).toHaveBeenCalledTimes(1);
    });

    it('should not modify config when updating in non-existent environment', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const configBefore = result.current.config;

      act(() => {
        result.current.updateDiagram('non-existent', 'diagram-1', { name: 'Updated' });
      });

      expect(result.current.config).toEqual(configBefore);
    });

    it('should not modify config when updating non-existent diagram', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const configBefore = result.current.config;

      act(() => {
        result.current.updateDiagram('env-1', 'non-existent-diagram', { name: 'Updated' });
      });

      expect(result.current.config.environments[0].diagrams[0].name).toBe('Test Diagram');
    });
  });

  describe('loadConfig', () => {
    it('should load a new configuration', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ onConfigChange })
      );

      act(() => {
        result.current.loadConfig(mockInitialConfig);
      });

      expect(result.current.config).toEqual(mockInitialConfig);
      expect(onConfigChange).toHaveBeenCalledWith(mockInitialConfig);
    });

    it('should replace existing configuration', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const newConfig: DiagramsConfiguration = {
        version: '2.0.0',
        environments: [],
      };

      act(() => {
        result.current.loadConfig(newConfig);
      });

      expect(result.current.config).toEqual(newConfig);
      expect(result.current.config.version).toBe('2.0.0');
      expect(result.current.config.environments).toHaveLength(0);
    });
  });

  describe('exportConfig', () => {
    it('should export config as formatted JSON string', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const exported = result.current.exportConfig();

      expect(exported).toBe(JSON.stringify(mockInitialConfig, null, 2));
    });

    it('should export empty config as formatted JSON string', () => {
      const { result } = renderHook(() => useDiagrams());

      const exported = result.current.exportConfig();

      expect(exported).toBe(JSON.stringify({ version: '1.0.0', environments: [] }, null, 2));
    });
  });

  describe('importConfig', () => {
    it('should import valid JSON configuration', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ onConfigChange })
      );

      const jsonString = JSON.stringify(mockInitialConfig);

      act(() => {
        const response = result.current.importConfig(jsonString);
        expect(response.success).toBe(true);
      });

      expect(result.current.config).toEqual(mockInitialConfig);
      expect(onConfigChange).toHaveBeenCalledWith(mockInitialConfig);
    });

    it('should return error for invalid JSON', () => {
      const { result } = renderHook(() => useDiagrams());

      let response;
      act(() => {
        response = result.current.importConfig('invalid json {]');
      });

      expect(response).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should not modify config when import fails', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      const configBefore = result.current.config;

      act(() => {
        result.current.importConfig('{ invalid }');
      });

      expect(result.current.config).toEqual(configBefore);
    });

    it('should handle empty string as invalid JSON', () => {
      const { result } = renderHook(() => useDiagrams());

      let response;
      act(() => {
        response = result.current.importConfig('');
      });

      expect(response).toMatchObject({
        success: false,
      });
    });
  });

  describe('onConfigChange callback', () => {
    it('should call onConfigChange when adding diagram', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      act(() => {
        result.current.addDiagram('env-1', mockDiagram);
      });

      expect(onConfigChange).toHaveBeenCalled();
    });

    it('should call onConfigChange when removing diagram', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      act(() => {
        result.current.removeDiagram('env-1', 'diagram-1');
      });

      expect(onConfigChange).toHaveBeenCalled();
    });

    it('should call onConfigChange when updating diagram', () => {
      const onConfigChange = vi.fn();
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig, onConfigChange })
      );

      act(() => {
        result.current.updateDiagram('env-1', 'diagram-1', { name: 'Updated' });
      });

      expect(onConfigChange).toHaveBeenCalled();
    });

    it('should not throw when onConfigChange is not provided', () => {
      const { result } = renderHook(() =>
        useDiagrams({ initialConfig: mockInitialConfig })
      );

      expect(() => {
        act(() => {
          result.current.addDiagram('env-1', mockDiagram);
        });
      }).not.toThrow();
    });
  });
});
