# Navigation & Storage Architecture Proposal

## 🎯 Goal
Use Apps tab as a navigation hub where clicking on nodes navigates to dedicated editors (Environments, Entities, Workflows, etc.) with proper data persistence.

## 🏗️ Architecture Overview

### Navigation Flow
```
Apps Canvas (Overview)
  ├─ Click Environment Node → Navigate to Environments Tab
  ├─ Click Entity Node → Navigate to Data Tab (Entity Editor)
  ├─ Click Workflow Node → Navigate to Workflow Tab
  └─ Click Code Node → Navigate to Code Tab
```

### Storage Strategy: **Hybrid Approach**

#### 1. **localStorage** (Primary - Fast Access)
```typescript
// App-level index
"app-${appName}-index": {
  name: "pet-shop",
  version: "1.0",
  created: "2024-01-01",
  updated: "2024-01-15",
  environments: ["env-prod", "env-dev"],
  entities: ["entity-pet-v1", "entity-owner-v1"]
}

// Environment data
"env-${envId}": {
  id: "env-prod",
  name: "Production",
  url: "https://prod.example.com",
  status: "active",
  environmentType: "production"
}

// Entity data (detailed)
"entity-${entityName}-v${version}": {
  name: "pet",
  version: "1",
  description: "Pet entity for adoption system",
  model: {
    name: "string",
    age: "number",
    breed: "string",
    // Full JSON schema
  },
  workflows: ["workflow-pet-adoption", "workflow-pet-health"],
  cyoda_url: "https://cyoda.example.com/entities/pet/v1",
  github_url: "https://github.com/org/repo/tree/main/entities/pet/v1",
  githubBranch: "feature/pet-entity-v1",
  githubPath: "entities/pet/v1/"
}

// Workflow data (already exists)
"workflow-canvas-data-${workflowId}": {
  // Workflow states, transitions, etc.
}
```

#### 2. **GitHub** (Secondary - Persistence & Collaboration)
```
Repository Structure:
apps/
  └── pet-shop/
      ├── app.json                    # App metadata
      ├── environments/
      │   ├── production.json
      │   └── development.json
      └── entities/
          ├── pet/
          │   └── v1/
          │       ├── entity.json     # Entity metadata
          │       ├── model.json      # Data model/schema
          │       └── workflows/
          │           ├── pet-adoption.json
          │           └── pet-health.json
          └── owner/
              └── v1/
                  ├── entity.json
                  ├── model.json
                  └── workflows/
```

## 🔄 Navigation Implementation

### 1. Update `onNavigate` Callback

```typescript
// In AppsTabsContainer.tsx
const handleNavigate = useCallback((tab: CanvasTab, targetId: string) => {
  console.log('Navigate to:', tab, targetId);
  
  // Parse target ID to get entity/workflow details
  const [type, ...rest] = targetId.split('-');
  
  switch (tab) {
    case 'environments':
      // Switch to Environments tab and load environment
      setActiveCanvasTab('environments');
      // Open environment in EnvironmentsTabs
      openEnvironmentTab(targetId);
      break;
      
    case 'data':
      // Switch to Data tab and load entity
      setActiveCanvasTab('data');
      // Open entity editor
      const entityName = rest[0];
      const entityVersion = rest[1];
      openEntityEditor(entityName, entityVersion);
      break;
      
    case 'workflow':
      // Switch to Workflow tab and load workflow
      setActiveCanvasTab('workflow');
      // Open workflow in WorkflowTabs
      const workflowName = rest.join('-');
      openWorkflowTab(workflowName);
      break;
      
    case 'code':
      // Switch to Code tab
      setActiveCanvasTab('code');
      openCodeEditor(targetId);
      break;
  }
}, []);
```

### 2. Create Storage Service

```typescript
// packages/web/src/services/AppStorageService.ts

export class AppStorageService {
  private storage = new HelperStorage();
  
  // App-level operations
  saveApp(appName: string, appData: AppRoot): void {
    const key = `app-${appName}-index`;
    this.storage.set(key, {
      name: appData.app.name,
      version: appData.app.version,
      updated: new Date().toISOString(),
      environments: appData.app.environments.map(e => `env-${e.name}`),
      entities: appData.app.entities.map(e => `entity-${e.name}-v${e.version}`)
    });
    
    // Save environments
    appData.app.environments.forEach(env => {
      this.saveEnvironment(env);
    });
    
    // Save entities
    appData.app.entities.forEach(entity => {
      this.saveEntity(entity);
    });
  }
  
  loadApp(appName: string): AppRoot | null {
    const key = `app-${appName}-index`;
    const index = this.storage.get(key, null);
    if (!index) return null;
    
    // Load environments
    const environments = index.environments.map(envKey => 
      this.storage.get(envKey, null)
    ).filter(Boolean);
    
    // Load entities
    const entities = index.entities.map(entityKey => 
      this.storage.get(entityKey, null)
    ).filter(Boolean);
    
    return {
      app: {
        name: index.name,
        version: index.version,
        environments,
        entities
      }
    };
  }
  
  // Environment operations
  saveEnvironment(env: AppEnvironment): void {
    const key = `env-${env.name}`;
    this.storage.set(key, env);
  }
  
  loadEnvironment(envName: string): AppEnvironment | null {
    const key = `env-${envName}`;
    return this.storage.get(key, null);
  }
  
  // Entity operations
  saveEntity(entity: Entity): void {
    const key = `entity-${entity.name}-v${entity.version}`;
    this.storage.set(key, entity);
    
    // Save each workflow
    entity.workflows.forEach(workflow => {
      this.saveWorkflow(workflow, entity.name, entity.version);
    });
  }
  
  loadEntity(entityName: string, version: string): Entity | null {
    const key = `entity-${entityName}-v${version}`;
    const entity = this.storage.get(key, null);
    
    if (!entity) return null;
    
    // Load workflows
    const workflows = entity.workflows.map(wf => 
      this.loadWorkflow(wf.name, entityName, version)
    ).filter(Boolean);
    
    return { ...entity, workflows };
  }
  
  // Workflow operations
  saveWorkflow(workflow: Workflow, entityName: string, entityVersion: string): void {
    const key = `workflow-${workflow.name}`;
    this.storage.set(key, {
      ...workflow,
      entityName,
      entityVersion
    });
  }
  
  loadWorkflow(workflowName: string, entityName: string, entityVersion: string): Workflow | null {
    const key = `workflow-${workflowName}`;
    return this.storage.get(key, null);
  }
  
  // GitHub sync operations
  async syncToGitHub(appName: string, githubConfig: GitHubConfig): Promise<void> {
    const appData = this.loadApp(appName);
    if (!appData) throw new Error('App not found');
    
    // Create branch
    const branch = `feature/${appName}-${Date.now()}`;
    
    // Commit app structure to GitHub
    // This would use GitHub API
    await this.commitToGitHub(appData, branch, githubConfig);
  }
  
  async loadFromGitHub(appName: string, githubConfig: GitHubConfig): Promise<AppRoot> {
    // Load from GitHub and cache in localStorage
    const appData = await this.fetchFromGitHub(appName, githubConfig);
    this.saveApp(appName, appData);
    return appData;
  }
}
```

### 3. Update Node Click Handlers

```typescript
// In AppsCanvas.tsx
const handleNodeClick = useCallback((nodeId: string, nodeType: string) => {
  console.log('🎯 Node clicked:', nodeId, nodeType);
  
  // Determine which tab to navigate to
  let targetTab: CanvasTab;
  
  switch (nodeType) {
    case 'environmentNode':
      targetTab = 'environments';
      break;
    case 'entityNode':
      targetTab = 'data';
      break;
    case 'workflowNode':
      targetTab = 'workflow';
      break;
    case 'appNode':
      // Stay on apps tab, just scroll to node in JSON editor
      setJsonEditorNavigateToNode(nodeId);
      return;
    default:
      targetTab = 'apps';
  }
  
  // Call navigation callback
  onNavigate?.(targetTab, nodeId);
}, [onNavigate]);
```

## 📝 Implementation Steps

### Phase 1: Storage Service (Week 1)
1. ✅ Create `AppStorageService.ts`
2. ✅ Implement localStorage operations
3. ✅ Add tests for storage service
4. ✅ Integrate with AppsCanvas

### Phase 2: Navigation (Week 2)
1. ✅ Update `onNavigate` callback in AppsTabsContainer
2. ✅ Create tab switching logic
3. ✅ Create EnvironmentsTabs component (similar to WorkflowTabs)
4. ✅ Create EntityEditor component for Data tab
5. ✅ Wire up navigation from Apps canvas to other tabs

### Phase 3: GitHub Integration (Week 3)
1. ✅ Design GitHub repository structure
2. ✅ Implement GitHub API integration
3. ✅ Add sync buttons (Push to GitHub, Pull from GitHub)
4. ✅ Handle merge conflicts
5. ✅ Add branch management

### Phase 4: Polish (Week 4)
1. ✅ Add loading states
2. ✅ Add error handling
3. ✅ Add offline support
4. ✅ Add data validation
5. ✅ Add migration tools

## 🎨 UI/UX Enhancements

### Breadcrumb Navigation
```tsx
<div className="breadcrumb">
  <span onClick={() => navigateToApps()}>Apps</span>
  <span>/</span>
  <span onClick={() => navigateToApp('pet-shop')}>pet-shop</span>
  <span>/</span>
  <span onClick={() => navigateToEntity('pet', '1')}>pet v1</span>
  <span>/</span>
  <span className="active">Workflows</span>
</div>
```

### Quick Navigation Panel
```tsx
<div className="quick-nav">
  <button onClick={() => navigateBack()}>← Back to Apps</button>
  <button onClick={() => navigateToRelated('workflows')}>View Workflows</button>
  <button onClick={() => navigateToRelated('requirements')}>View Requirements</button>
</div>
```

## 🔐 Data Consistency

### Validation Rules
1. Entity name + version must be unique
2. Workflow names must be unique within entity
3. GitHub URLs must be valid
4. Model schema must be valid JSON

### Sync Strategy
1. **Auto-save to localStorage**: Every change
2. **Manual sync to GitHub**: User-triggered
3. **Conflict resolution**: Show diff, let user choose
4. **Backup**: Keep last 5 versions in localStorage

## 🚀 Benefits

1. **Fast**: localStorage for instant access
2. **Persistent**: GitHub for long-term storage
3. **Collaborative**: GitHub enables team collaboration
4. **Offline-capable**: Works without internet
5. **Versioned**: Git history for all changes
6. **Scalable**: Can handle large apps with many entities

## 📊 Example Usage

```typescript
const storageService = new AppStorageService();

// Save app
storageService.saveApp('pet-shop', appData);

// Load entity
const petEntity = storageService.loadEntity('pet', '1');

// Navigate to entity editor
handleNavigate('data', 'entity-pet-v1');

// Sync to GitHub
await storageService.syncToGitHub('pet-shop', {
  repo: 'org/repo',
  token: 'github_token',
  branch: 'feature/pet-shop'
});
```

