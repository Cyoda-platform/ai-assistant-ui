# TaskDashboard Component

A real-time dashboard for monitoring background tasks in conversations. Displays task progress, status, and detailed information with automatic polling.

## Features

- **Real-time Updates**: Polls tasks every 3 seconds for live progress updates
- **Status Filtering**: Filter tasks by status (All, Active, Completed, Failed)
- **Expandable Details**: Click to expand task cards for detailed information
- **Progress Visualization**: Animated progress bars with percentage indicators
- **Auto-cleanup**: Automatically stops polling when component unmounts

## Components

### TaskDashboard

Main dashboard component that manages task polling and display.

**Props:**
- `conversationId` (string, required) - The conversation ID to fetch tasks for
- `backgroundTaskIds` (string[], optional) - Array of task IDs (for reference)

**Example:**
```tsx
<TaskDashboard 
  conversationId="conv-123"
  backgroundTaskIds={["task-1", "task-2"]}
/>
```

### TaskCard

Individual task card component with expandable details.

**Props:**
- `task` (BackgroundTask, required) - The task object to display

**Example:**
```tsx
<TaskCard task={taskObject} />
```

## Task Status

Tasks can have the following statuses:

- **pending** - Task created but not started (yellow indicator)
- **running** - Task is currently executing (blue indicator, animated)
- **completed** - Task finished successfully (green indicator)
- **failed** - Task encountered an error (red indicator)
- **cancelled** - Task was cancelled (gray indicator)

## Task Data Structure

```typescript
interface BackgroundTask {
  technical_id: string;
  user_id: string;
  task_type: 'build_app' | 'deploy_env' | string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  name: string;
  description: string;
  date: string;
  started_at?: string;
  completed_at?: string;
  branch_name?: string;
  language?: string;
  conversation_id: string;
  repository_path?: string;
  repository_type?: string;
  progress_messages: ProgressMessage[];
  result?: any;
  error?: string;
  process_pid?: number;
  build_job_id?: string;
  statistics: TaskStatistics;
}
```

## Integration with EntityDataPanel

The TaskDashboard is integrated into the EntityDataPanel as a tab:

```tsx
<EntityDataPanel
  isOpen={isEntityDataOpen}
  onClose={() => setIsEntityDataOpen(false)}
  chatData={chatData}
  conversationId={technicalId} // Required for task dashboard
  width={entityDataResize.width}
  onWidthChange={entityDataResize.setWidth}
  onRefresh={() => loadChatHistory()}
  onRollbackChat={onRollbackChat}
  isLoadingRollback={isLoadingRollback}
/>
```

## API Endpoints

The TaskDashboard uses the following API endpoints:

- `GET /api/v1/tasks/{taskId}` - Get single task by ID
- `GET /api/v1/tasks?conversation_id={id}` - List all tasks for a conversation

## Polling Behavior

- **Interval**: 3 seconds (configurable)
- **Auto-stop**: Stops polling when all tasks are completed/failed/cancelled
- **Cleanup**: Automatically stops polling on component unmount
- **Error Handling**: Continues polling on transient errors, stops on 404/403

## Expandable Details

When a task card is expanded, it shows:

- Branch name and repository link
- Build job ID
- Process PID
- Error messages (if failed)
- Progress log with timestamps
- Result data (if completed)
- Full timestamps (created, started, completed)

## Styling

The component uses Tailwind CSS with the following color scheme:

- **Background**: `bg-slate-800/95` with backdrop blur
- **Borders**: `border-slate-600` and `border-slate-700`
- **Status Colors**:
  - Pending: Yellow (`text-yellow-400`, `bg-yellow-500/20`)
  - Running: Blue (`text-blue-400`, `bg-blue-500/20`)
  - Completed: Green (`text-green-400`, `bg-green-500/20`)
  - Failed: Red (`text-red-400`, `bg-red-500/20`)
  - Cancelled: Gray (`text-gray-400`, `bg-gray-500/20`)

## Performance Considerations

- Uses `useCallback` for memoized functions
- Filters tasks client-side for instant filtering
- Stops polling completed tasks to reduce API calls
- Cleans up intervals on unmount to prevent memory leaks

## Future Enhancements

- [ ] Pause/resume polling manually
- [ ] Export task logs
- [ ] Task cancellation from UI
- [ ] Retry failed tasks
- [ ] Task grouping by type
- [ ] Notification on task completion
- [ ] WebSocket support for real-time updates (instead of polling)

