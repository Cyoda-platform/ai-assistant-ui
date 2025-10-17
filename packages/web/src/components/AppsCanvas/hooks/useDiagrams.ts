/**
 * Hook for managing diagrams in the canvas
 */

import { useState, useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import type { DiagramsConfiguration, DiagramConfig } from '../types/diagrams';
import {
  diagramsConfigToNodes,
  getDiagramNodesForEnvironment,
  addDiagramToEnvironment,
  removeDiagramFromEnvironment,
  updateDiagramInEnvironment,
} from '../utils/diagramConverter';

export interface UseDiagramsOptions {
  initialConfig?: DiagramsConfiguration;
  onConfigChange?: (config: DiagramsConfiguration) => void;
}

export function useDiagrams(options: UseDiagramsOptions = {}) {
  const { initialConfig, onConfigChange } = options;

  const [config, setConfig] = useState<DiagramsConfiguration>(
    initialConfig || {
      version: '1.0.0',
      environments: [],
    }
  );

  // Convert config to React Flow nodes
  const diagramNodes = useMemo(() => {
    return diagramsConfigToNodes(config);
  }, [config]);

  // Get diagrams for a specific environment
  const getDiagramsForEnv = useCallback(
    (environmentId: string, basePosition?: { x: number; y: number }): Node[] => {
      return getDiagramNodesForEnvironment(config, environmentId, basePosition);
    },
    [config]
  );

  // Add a new diagram
  const addDiagram = useCallback(
    (environmentId: string, diagram: DiagramConfig) => {
      const newConfig = addDiagramToEnvironment(config, environmentId, diagram);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [config, onConfigChange]
  );

  // Remove a diagram
  const removeDiagram = useCallback(
    (environmentId: string, diagramId: string) => {
      const newConfig = removeDiagramFromEnvironment(config, environmentId, diagramId);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [config, onConfigChange]
  );

  // Update a diagram
  const updateDiagram = useCallback(
    (environmentId: string, diagramId: string, updates: Partial<DiagramConfig>) => {
      const newConfig = updateDiagramInEnvironment(config, environmentId, diagramId, updates);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [config, onConfigChange]
  );

  // Load a new configuration
  const loadConfig = useCallback(
    (newConfig: DiagramsConfiguration) => {
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [onConfigChange]
  );

  // Export configuration as JSON
  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Import configuration from JSON
  const importConfig = useCallback(
    (jsonString: string) => {
      try {
        const newConfig = JSON.parse(jsonString) as DiagramsConfiguration;
        setConfig(newConfig);
        onConfigChange?.(newConfig);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Invalid JSON' 
        };
      }
    },
    [onConfigChange]
  );

  return {
    config,
    diagramNodes,
    getDiagramsForEnv,
    addDiagram,
    removeDiagram,
    updateDiagram,
    loadConfig,
    exportConfig,
    importConfig,
  };
}

