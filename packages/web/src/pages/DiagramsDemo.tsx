/**
 * Diagrams Demo Page
 * Showcases the diagrams canvas with mock data
 */

import React, { useState } from 'react';
import { DiagramsCanvas } from '../components/AppsCanvas/DiagramsCanvas';
import { mockDiagramsConfig } from '../components/AppsCanvas/mockDiagrams';
import type { DiagramsConfiguration } from '../components/AppsCanvas/types/diagrams';

export const DiagramsDemo: React.FC = () => {
  const [config, setConfig] = useState<DiagramsConfiguration>(mockDiagramsConfig);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | undefined>(undefined);

  const environments = config.environments.map(env => ({
    id: env.environmentId,
    name: env.environmentName,
    diagramCount: env.diagrams.length,
  }));

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Diagrams Canvas Demo</h1>
            <p className="text-sm text-gray-400 mt-1">
              Interactive diagrams for environment visualization
            </p>
          </div>

          {/* Environment Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-400">Filter by Environment:</label>
            <select
              value={selectedEnvironment || ''}
              onChange={(e) => setSelectedEnvironment(e.target.value || undefined)}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Environments</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>
                  {env.name} ({env.diagramCount} diagrams)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-sm text-gray-300">Mermaid Diagrams</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-300">React Flow Diagrams</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-300">Chart.js Diagrams</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <DiagramsCanvas
          diagramsConfig={config}
          onConfigChange={setConfig}
          environmentFilter={selectedEnvironment}
        />
      </div>

      {/* Footer Info */}
      <div className="bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            Total: {config.environments.reduce((sum, env) => sum + env.diagrams.length, 0)} diagrams
            across {config.environments.length} environments
          </div>
          <div>
            Use mouse wheel to zoom • Drag to pan • Click diagram to interact
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramsDemo;

