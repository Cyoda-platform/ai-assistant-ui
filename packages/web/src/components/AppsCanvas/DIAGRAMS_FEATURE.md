# 📊 Diagrams Feature for Canvas Environments

## Overview

The Diagrams feature allows you to add interactive, configurable diagrams to canvas environments. Diagrams are fully configurable via JSON and support multiple diagram libraries.

## Features

✅ **Multiple Diagram Libraries**
- Mermaid (flowcharts, sequence diagrams, ER diagrams, etc.)
- React Flow (custom node-based diagrams)
- Chart.js (charts and graphs)
- Extensible for custom diagram types

✅ **JSON Configuration**
- Define diagrams in JSON format
- Schema validation
- Import/Export functionality
- Environment-specific diagrams

✅ **Interactive Canvas**
- Drag and drop diagrams
- Zoom and pan
- Expand/collapse diagrams
- Copy diagram source
- Download diagrams

✅ **Environment Integration**
- Associate diagrams with specific environments
- Filter diagrams by environment
- Multiple diagrams per environment

## Supported Diagram Types

### Mermaid Diagrams

The following Mermaid diagram types are supported:

1. **Flowchart** - Process flows and decision trees
2. **Sequence** - Interaction sequences between components
3. **Class** - Class diagrams for OOP
4. **State** - State machines and transitions
5. **ER** - Entity-relationship diagrams
6. **Gantt** - Project timelines
7. **Pie** - Pie charts
8. **Journey** - User journey maps
9. **Gitgraph** - Git branch visualization
10. **Mindmap** - Mind maps
11. **Timeline** - Timeline diagrams
12. **Quadrant** - Quadrant charts
13. **Requirement** - Requirement diagrams
14. **C4** - C4 architecture diagrams

## Configuration

### JSON Schema

Diagrams are configured using a JSON file that follows the schema defined in `diagrams_schema.json`.

### Basic Structure

```json
{
  "version": "1.0.0",
  "environments": [
    {
      "environmentId": "production",
      "environmentName": "Production",
      "diagrams": [
        {
          "id": "unique-diagram-id",
          "name": "Diagram Name",
          "description": "Diagram description",
          "library": "mermaid",
          "diagramType": "flowchart",
          "theme": "dark",
          "content": "graph TB\n    A --> B",
          "position": { "x": 100, "y": 100 }
        }
      ]
    }
  ]
}
```

### Mermaid Diagram Example

```json
{
  "id": "system-architecture",
  "name": "System Architecture",
  "description": "Production system overview",
  "library": "mermaid",
  "diagramType": "flowchart",
  "theme": "dark",
  "content": "graph TB\n    A[Load Balancer] --> B[Web Server]\n    B --> C[Database]",
  "position": { "x": 100, "y": 100 }
}
```

### Sequence Diagram Example

```json
{
  "id": "api-flow",
  "name": "API Request Flow",
  "library": "mermaid",
  "diagramType": "sequence",
  "content": "sequenceDiagram\n    Client->>API: Request\n    API->>DB: Query\n    DB-->>API: Data\n    API-->>Client: Response"
}
```

### ER Diagram Example

```json
{
  "id": "database-schema",
  "name": "Database Schema",
  "library": "mermaid",
  "diagramType": "er",
  "content": "erDiagram\n    USER ||--o{ ORDER : places\n    ORDER ||--|{ ITEM : contains"
}
```

## Usage

### 1. Using DiagramsCanvas Component

```tsx
import { DiagramsCanvas } from '@/components/AppsCanvas/DiagramsCanvas';
import { mockDiagramsConfig } from '@/components/AppsCanvas/mockDiagrams';

function MyComponent() {
  return (
    <DiagramsCanvas
      diagramsConfig={mockDiagramsConfig}
      onConfigChange={(config) => console.log('Config updated:', config)}
      environmentFilter="production" // Optional: filter by environment
    />
  );
}
```

### 2. Using the useDiagrams Hook

```tsx
import { useDiagrams } from '@/components/AppsCanvas/hooks/useDiagrams';

function MyComponent() {
  const {
    config,
    diagramNodes,
    addDiagram,
    removeDiagram,
    updateDiagram,
    exportConfig,
    importConfig,
  } = useDiagrams({
    initialConfig: myConfig,
    onConfigChange: (config) => console.log('Updated:', config),
  });

  // Add a new diagram
  const handleAddDiagram = () => {
    addDiagram('production', {
      id: 'new-diagram',
      name: 'New Diagram',
      library: 'mermaid',
      diagramType: 'flowchart',
      content: 'graph TB\n    A --> B',
    });
  };

  return <div>...</div>;
}
```

### 3. Integrating with Existing Canvas

```tsx
import { DiagramNode } from '@/components/AppsCanvas/nodes/DiagramNode';
import { diagramsConfigToNodes } from '@/components/AppsCanvas/utils/diagramConverter';

// Register the node type
const nodeTypes = {
  diagramNode: DiagramNode,
  // ... other node types
};

// Convert diagrams to nodes
const diagramNodes = diagramsConfigToNodes(myDiagramsConfig);

// Use in ReactFlow
<ReactFlow nodes={[...otherNodes, ...diagramNodes]} nodeTypes={nodeTypes} />
```

## Mock Data

Pre-configured mock diagrams are available in `mockDiagrams.ts`:

- **Production Environment**: Architecture, deployment pipeline, monitoring, request flow
- **Staging Environment**: Testing workflow, state machine, sprint timeline
- **Development Environment**: Local setup, database schema, git workflow, class diagram
- **Test Environment**: User journey, test coverage matrix

## Demo Page

A demo page is available at `/diagrams-demo` (see `pages/DiagramsDemo.tsx`):

- View all diagrams across environments
- Filter by environment
- Export/import configurations
- Interactive diagram manipulation

## File Structure

```
AppsCanvas/
├── types/
│   └── diagrams.ts              # TypeScript types
├── nodes/
│   └── DiagramNode.tsx          # Diagram node component
├── hooks/
│   └── useDiagrams.ts           # Diagrams management hook
├── utils/
│   └── diagramConverter.ts      # Conversion utilities
├── mockDiagrams.ts              # Mock diagram data
├── DiagramsCanvas.tsx           # Main canvas component
└── DIAGRAMS_FEATURE.md          # This file

Root files:
├── diagrams_schema.json         # JSON schema for validation
└── diagrams_config_example.json # Example configuration
```

## API Reference

### DiagramsCanvas Props

| Prop | Type | Description |
|------|------|-------------|
| `diagramsConfig` | `DiagramsConfiguration` | Initial diagram configuration |
| `onConfigChange` | `(config: DiagramsConfiguration) => void` | Callback when config changes |
| `environmentFilter` | `string` | Filter diagrams by environment ID |

### useDiagrams Hook

Returns an object with:

- `config`: Current configuration
- `diagramNodes`: React Flow nodes for all diagrams
- `getDiagramsForEnv(envId, basePosition)`: Get nodes for specific environment
- `addDiagram(envId, diagram)`: Add a new diagram
- `removeDiagram(envId, diagramId)`: Remove a diagram
- `updateDiagram(envId, diagramId, updates)`: Update a diagram
- `loadConfig(config)`: Load a new configuration
- `exportConfig()`: Export config as JSON string
- `importConfig(jsonString)`: Import config from JSON string

## Extending

### Adding a New Diagram Library

1. Add the library type to `types/diagrams.ts`
2. Create a config interface extending `BaseDiagramConfig`
3. Update the `DiagramConfig` union type
4. Implement rendering in `DiagramNode.tsx`
5. Update the schema in `diagrams_schema.json`

### Custom Diagram Rendering

```tsx
// In DiagramNode.tsx
const renderDiagramContent = () => {
  if (diagram.library === 'custom') {
    const customDiagram = diagram as CustomDiagramConfig;
    return <MyCustomDiagramComponent {...customDiagram.props} />;
  }
  // ... other libraries
};
```

## Best Practices

1. **Use meaningful IDs**: Make diagram IDs descriptive and unique
2. **Add descriptions**: Help users understand what each diagram shows
3. **Position diagrams**: Set explicit positions to avoid overlapping
4. **Group by environment**: Keep related diagrams in the same environment
5. **Use appropriate types**: Choose the right diagram type for your data
6. **Keep content readable**: Don't overcrowd diagrams with too much information

## Troubleshooting

### Diagram not rendering

- Check that the Mermaid syntax is valid
- Verify the diagram type is supported
- Check browser console for errors

### Import fails

- Validate JSON against the schema
- Check for required fields
- Ensure version format is correct (x.y.z)

### Performance issues

- Limit the number of diagrams per environment
- Use environment filtering
- Consider lazy loading for large diagrams

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Diagram templates
- [ ] Auto-layout algorithms
- [ ] Diagram versioning
- [ ] Export to image/PDF
- [ ] Diagram search and filtering
- [ ] Custom themes
- [ ] Diagram annotations

