# Environments Tab Added to Canvas

## Summary

Added a new "Environments" tab to the ChatBotCanvas component, following the same pattern as the existing tabs (Apps, Data, Workflow, Requirement, Code).

## Changes Made

### 1. Updated ChatBotCanvas Component

**File:** `packages/web/src/components/ChatBot/ChatBotCanvas.tsx`

#### Added Server Icon Import
```typescript
import {
  // ... other imports
  Server
} from 'lucide-react';
```

#### Updated State Type
```typescript
const [activeTab, setActiveTab] = useState<'apps' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments'>('apps');
```

#### Added Environments Tab Button
```tsx
<button
  onClick={() => setActiveTab('environments')}
  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
    activeTab === 'environments'
      ? 'bg-teal-500 text-white shadow-md'
      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
  }`}
>
  <Server size={14} />
  <span>Environments</span>
</button>
```

#### Added Environments Tab Content
```tsx
activeTab === 'environments' ? (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Server size={64} className="mx-auto mb-4 text-gray-600" />
      <h2 className="text-xl font-semibold text-gray-300 mb-2">
        Environments Management
      </h2>
      <p className="text-gray-500 mb-6">
        Manage deployment environments and configurations
      </p>
      <p className="text-gray-400 text-sm">Coming soon...</p>
    </div>
  </div>
)
```

### 2. Updated Type Definitions

**File:** `packages/web/src/components/AppsCanvas/types/apps.ts`

```typescript
// Canvas tab types
export type CanvasTab = 'portal' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments';
```

## Tab Order

The tabs now appear in this order:
1. **Apps** - Application management (with AppsTabsContainer)
2. **Data** - Data editor (coming soon)
3. **Workflow** - Workflow editor (with WorkflowTabs)
4. **Requirement** - Requirements management (coming soon)
5. **Code** - Code editor (coming soon)
6. **Environments** - Environments management (coming soon) ✨ NEW

## Visual Design

- **Icon:** Server icon from lucide-react
- **Active State:** Teal background with white text and shadow
- **Inactive State:** Slate text with hover effects
- **Content:** Placeholder with centered icon, title, description, and "Coming soon" message

## Next Steps

To implement the Environments tab functionality:

1. Create an `EnvironmentsTabs` component similar to `WorkflowTabs` and `AppsTabs`
2. Create an `EnvironmentsTabsContainer` component
3. Create a store `environmentsTabs.ts` using Zustand with persistence
4. Create an `EnvironmentsCanvas` component for managing environments
5. Replace the placeholder content with `<EnvironmentsTabsContainer />`

## Pattern Consistency

The Environments tab follows the exact same pattern as:
- **Apps Tab:** Uses `AppsTabsContainer` with tab management
- **Workflow Tab:** Uses `WorkflowTabs` with tab management
- **Other Tabs:** Placeholder content with "Coming soon" message

This ensures consistency across the application and makes it easy to implement the full functionality later.

