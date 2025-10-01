# Workflow Environment Sync ☁️

## Overview

The Workflow Canvas now supports importing and exporting workflows directly to/from your CYODA environment! This allows you to sync your local workflow designs with the deployed environment.

## Features

### 🌐 Environment URL Calculation

The system automatically builds the correct environment URL based on:
- **Environment Prefix** (`VITE_APP_CYODA_CLIENT_ENV_PREFIX`) - e.g., `dev-`, `prod-`
- **Organization ID** (from JWT token `caas_org_id`) - automatically lowercased
- **Host Domain** (`VITE_APP_CYODA_CLIENT_HOST`) - e.g., `cyoda.com`

**Formula:**
```
https://{cleanPrefix}-{orgId}.{host}/api/model/{entityName}/{modelVersion}/workflow/{endpoint}
```

**Examples:**
```
Environment: dev-
Org ID: ACME123
Host: cyoda.com
Entity: entity1
Version: 1

Export (POST to import): https://dev-acme123.cyoda.com/api/model/entity1/1/workflow/import
Import (GET from export): https://dev-acme123.cyoda.com/api/model/entity1/1/workflow/export
```

### ☁️ Export to Environment

**Button:** Cloud with up arrow (blue gradient)
**Location:** Canvas controls (right side)
**Tooltip:** "Export workflow to environment (entity1/v1)"

**What it does:**
1. Takes your current workflow configuration
2. Sends it to the environment via POST to import endpoint
3. Uses your authentication token
4. Shows success/error message

**API Endpoint:**
```
POST /api/model/{entityName}/{modelVersion}/workflow/import
```

**Request:**
```bash
curl 'https://dev-acme123.cyoda.com/api/model/entity1/1/workflow/import' \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --data '{
    "workflows": [
      {
        "version": "1.0",
        "name": "My Workflow",
        "initialState": "DRAFT",
        "states": { ... }
      }
    ],
    "importMode": "REPLACE"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Workflows imported successfully"
}
```

### ☁️ Import from Environment

**Button:** Cloud with down arrow (blue gradient)
**Location:** Canvas controls (right side)
**Tooltip:** "Import workflow from environment (entity1/v1)"

**What it does:**
1. Fetches workflow from the environment via GET export endpoint
2. Validates the workflow structure
3. Replaces your current workflow (with confirmation)
4. Auto-layouts the imported workflow
5. Shows success/error message

**API Endpoint:**
```
GET /api/model/{entityName}/{modelVersion}/workflow/export
```

**Request:**
```bash
curl 'https://dev-acme123.cyoda.com/api/model/entity1/1/workflow/export' \
  --header 'Authorization: Bearer YOUR_TOKEN'
```

**Response (200 OK):**
```json
{
  "entityName": "entity1",
  "modelVersion": 1,
  "workflows": [
    {
      "version": "1.0",
      "name": "My Workflow",
      "initialState": "DRAFT",
      "states": { ... }
    }
  ]
}
```

## Current Configuration

### Hardcoded Values (Temporary)

Currently hardcoded for initial implementation:
```typescript
const entityName = 'entity1';
const modelVersion = 1;
```

**Future Enhancement:** These will be:
- Extracted from workflow metadata
- Configurable in UI
- Passed as props to WorkflowCanvas

## Usage

### Prerequisites

1. **Authentication Required**
   - You must be logged in (have a valid token)
   - Token is automatically included in requests
   - Guest tokens won't work for environment sync

2. **Environment Configuration**
   - `.env` file must have:
     - `VITE_APP_CYODA_CLIENT_ENV_PREFIX`
     - `VITE_APP_CYODA_CLIENT_HOST`
   - JWT token must contain `caas_org_id`

### Export Workflow

1. **Design your workflow** in the canvas
2. **Click the cloud upload button** (blue, right side controls)
3. **Confirm** the export
4. **Success message** shows entity and version
5. **Workflow is now in environment**

### Import Workflow

1. **Click the cloud download button** (blue, right side controls)
2. **Confirm** you want to replace current workflow
3. **Workflow is fetched** from environment
4. **Auto-layout applied** for clean visualization
5. **Success message** shows imported workflow name

## Error Handling

### Common Errors

#### 401 - Unauthorized
```
Failed to export workflow to environment:

Authentication Required (401)
Your session may have expired. Please log in again.
```

**Solution:** Log in with Auth0

#### 403 - Forbidden
```
Failed to export workflow to environment:

Access Denied (403)
You don't have permission to access this resource.
```

**Solution:** Check your permissions with administrator

#### 404 - Not Found
```
Failed to export workflow to environment:

Not Found (404)
The entity or workflow does not exist.
```

**Solution:** Verify entity name and version

#### 500 - Server Error
```
Failed to export workflow to environment:

Server Error (500)
The server encountered an error.
```

**Solution:** Try again later or contact support

#### Network Error
```
Failed to export workflow to environment:

Network Error
Unable to connect to the server.
```

**Solution:** Check internet connection

## Debug Logging

Both export and import include comprehensive debug logging:

```javascript
console.log('=== Export to Environment Debug ===');
console.log('URL:', url);
console.log('Token:', authStore.token.substring(0, 20) + '...');
console.log('Workflow:', cleanedWorkflow.configuration);
console.log('===================================');
```

Check browser console for:
- Full URL being called
- Token (first 20 chars)
- Workflow data being sent
- Response data
- Error details

## Visual Design

### Button Styling

**Export/Import Environment Buttons:**
- **Background:** Blue to cyan gradient
- **Icon Color:** Blue-600 (light) / Blue-400 (dark)
- **Size:** 16px icons
- **Position:** Between file import/export and auto-layout

**Distinguishing Features:**
- File operations: Black/white icons
- Environment operations: Blue gradient background + blue icons
- Active states: Lime green highlight

## Implementation Details

### URL Building Function

```typescript
const buildEnvironmentUrl = useCallback((path: string) => {
  if (!orgId) return '';
  const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
  const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';
  const cleanPrefix = envPrefix.endsWith('-')
    ? envPrefix.slice(0, -1)
    : envPrefix;
  return `https://${cleanPrefix}-${orgId}.${host}/api${path}`;
}, [orgId]);
```

### Export Handler

```typescript
const handleExportToEnvironment = useCallback(async () => {
  // Check authentication
  if (!cleanedWorkflow || !token) {
    alert('Please log in to export workflows to the environment');
    return;
  }

  // Build URL and make POST request to import endpoint
  const url = buildEnvironmentUrl(`/model/${entityName}/${modelVersion}/workflow/import`);

  const payload = {
    workflows: [cleanedWorkflow.configuration],
    importMode: 'REPLACE'
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Show success
  alert(`Successfully exported workflow to environment!`);
}, [cleanedWorkflow, token, buildEnvironmentUrl]);
```

### Import Handler

```typescript
const handleImportFromEnvironment = useCallback(async () => {
  // Check authentication
  if (!cleanedWorkflow || !authStore.token) {
    alert('Please log in to import workflows from the environment');
    return;
  }

  // Confirm replacement
  if (!confirm('This will replace your current workflow. Continue?')) {
    return;
  }

  // Fetch from environment
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${authStore.token}`,
    },
  });

  // Extract and validate workflow
  const config = response.data.workflows[0];
  
  // Create new workflow with imported config
  const newWorkflow = { ...cleanedWorkflow, configuration: config };
  
  // Apply auto-layout
  const layoutedWorkflow = autoLayoutWorkflow(newWorkflow);
  onWorkflowUpdate(layoutedWorkflow, 'Imported workflow from environment');
}, [cleanedWorkflow, authStore.token, buildEnvironmentUrl, onWorkflowUpdate]);
```

## Future Enhancements

### Planned Features

- [ ] **Dynamic Entity Selection** - Choose entity/version in UI
- [ ] **POST Import Endpoint** - Use proper import API with REPLACE mode
- [ ] **Batch Operations** - Import/export multiple workflows
- [ ] **Conflict Resolution** - Handle version conflicts
- [ ] **Diff View** - Preview changes before import
- [ ] **Sync Status** - Show if local differs from environment
- [ ] **Auto-sync** - Periodic sync with environment
- [ ] **Version History** - View and restore previous versions
- [ ] **Permissions Check** - Validate permissions before operations

### Configuration UI

Future UI for entity/version selection:
```typescript
interface EnvironmentSyncConfig {
  entityName: string;
  modelVersion: number;
  autoSync: boolean;
  syncInterval: number; // minutes
}
```

## Testing

### Test Export

1. Open workflow canvas
2. Create/modify a workflow
3. Click cloud upload button
4. Check browser console for debug logs
5. Verify success message
6. Check environment for exported workflow

### Test Import

1. Ensure workflow exists in environment
2. Click cloud download button
3. Confirm replacement
4. Check browser console for debug logs
5. Verify workflow is imported
6. Check auto-layout applied correctly

### Test Error Scenarios

1. **No Auth:** Log out, try export/import
2. **Network Error:** Disconnect internet, try operation
3. **Invalid Entity:** Change entity name to non-existent
4. **Server Error:** Test with unavailable environment

## Related Files

- `WorkflowCanvas.tsx` - Main implementation
- `ChatBotMessageFunction.tsx` - URL building reference
- `auth.ts` - Authentication store
- `error.ts` - Error handling

## FAQ

**Q: Why are entity name and version hardcoded?**
A: Initial implementation for testing. Will be made configurable soon.

**Q: Can I use this with guest tokens?**
A: No, you need to be logged in with Auth0 for environment operations.

**Q: What happens if import fails?**
A: Your current workflow is preserved. Import only applies on success.

**Q: Can I export to different environments?**
A: Yes, by changing the environment variables in `.env` file.

**Q: Is there a sync history?**
A: Not yet, but planned for future releases.

---

**Environment sync is now available!** ☁️🚀

Export your workflows to the cloud and import them back with just two clicks!

