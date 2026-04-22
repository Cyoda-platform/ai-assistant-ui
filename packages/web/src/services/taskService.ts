/**
 * Task Service - Handles background task API calls and polling
 */

import privateClient from '@/clients/private';

export interface ProgressMessage {
  message: string;
  timestamp: string;
  progress: number;
  metadata?: {
    elapsed_time?: number;
    pid?: number;
    [key: string]: any;
  };
  last_modified?: number;
  last_modified_at?: string;
}

export interface TaskStatistics {
  duration_formatted: string;
  time_remaining_formatted?: string;
  status_message: string;
}

export interface BackgroundTask {
  technical_id: string;
  user_id: string;
  task_type: 'build_app' | 'deploy_env' | string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  name: string;
  description: string;
  date: string;
  started_at?: string;
  completed_at?: string;
  branch_name?: string;
  language?: string;
  user_request?: string;
  conversation_id: string;
  repository_path?: string;
  repository_type?: string;
  repository_url?: string;
  progress_messages: ProgressMessage[];
  result?: any;
  error?: string;
  process_pid?: number;
  build_job_id?: string;
  build_id?: string;
  namespace?: string;
  env_url?: string;
  statistics: TaskStatistics;
  metadata?: {
    output?: string;
    elapsed_time?: number;
    changed_files?: string[];
    total_files?: number;
    [key: string]: any;
  };
}

export interface TaskListResponse {
  tasks: BackgroundTask[];
  count: number;
}

class TaskService {
  /**
   * Helper to detect if task is actually complete based on progress messages
   * This is a fallback for when backend hasn't updated status yet
   */
  private isTaskActuallyComplete(task: BackgroundTask): boolean {
    // If status is already terminal, trust it
    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return true;
    }

    // Check last progress message for completion indicators
    if (task.progress_messages && task.progress_messages.length > 0) {
      const lastMessage = task.progress_messages[task.progress_messages.length - 1];
      const message = lastMessage.message?.toLowerCase() || '';
      const state = lastMessage.metadata?.state?.toLowerCase() || '';

      // Check for completion keywords
      if (
        message.includes('finished') ||
        message.includes('completed') ||
        message.includes('success') ||
        state === 'finished' ||
        state === 'completed' ||
        state === 'success'
      ) {
        return true;
      }

      // Check for failure keywords
      if (
        message.includes('failed') ||
        message.includes('error') ||
        state === 'failed' ||
        state === 'error'
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<BackgroundTask> {
    const response = await privateClient.get<BackgroundTask>(`/v1/tasks/${taskId}`);
    return response.data;
  }

  /**
   * List tasks with optional filters
   */
  async listTasks(params?: {
    conversation_id?: string;
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    task_type?: string;
  }): Promise<TaskListResponse> {
    const response = await privateClient.get<TaskListResponse>('/v1/tasks', { params });
    return response.data;
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<{ message: string; task: BackgroundTask }> {
    const response = await privateClient.delete<{ message: string; task: BackgroundTask }>(
      `/v1/tasks/${taskId}/cancel`
    );
    return response.data;
  }

  /**
   * Poll a single task until completion or error
   * Returns a cleanup function to stop polling
   */
  pollTask(
    taskId: string,
    onUpdate: (task: BackgroundTask) => void,
    onComplete?: (task: BackgroundTask) => void,
    onError?: (error: any) => void,
    interval: number = 3000
  ): () => void {
    let pollInterval: NodeJS.Timeout | null = null;
    let isStopped = false;

    const poll = async () => {
      if (isStopped) return;

      try {
        const task = await this.getTask(taskId);
        onUpdate(task);

        // Stop polling if task is done
        if (['completed', 'failed', 'cancelled'].includes(task.status)) {
          this.stopPolling();
          if (onComplete) {
            onComplete(task);
          }
        }
      } catch (error: any) {
        // Stop polling on 404 or 403
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.stopPolling();
          if (onError) {
            onError(error);
          }
        } else {
          console.error(`Error polling task ${taskId}:`, error);
          if (onError) {
            onError(error);
          }
        }
      }
    };

    const stopPolling = () => {
      isStopped = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    this.stopPolling = stopPolling;

    // Start polling
    poll(); // Initial poll
    pollInterval = setInterval(poll, interval);

    // Return cleanup function
    return stopPolling;
  }

  private stopPolling: (() => void) | null = null;

  /**
   * Poll all tasks for a conversation
   * Returns a cleanup function to stop all polling
   */
  pollConversationTasks(
    conversationId: string,
    onUpdate: (tasks: BackgroundTask[]) => void,
    onError?: (error: any) => void,
    interval: number = 30000
  ): () => void {
    let pollInterval: NodeJS.Timeout | null = null;
    let isStopped = false;

    const poll = async () => {
      if (isStopped) return;

      try {
        const response = await this.listTasks({ conversation_id: conversationId });
        onUpdate(response.tasks);

        // Don't auto-stop polling - keep polling while the panel is open
        // This ensures we catch new tasks that are added after all tasks complete
      } catch (error: any) {
        // If 404, it means no tasks exist yet for this conversation - this is normal
        if (error?.response?.status === 404) {
          // Call onUpdate with empty array instead of error
          onUpdate([]);
          return;
        }

        // For other errors, log and call error handler
        console.error(`Error polling tasks for conversation ${conversationId}:`, error);
        if (onError) {
          onError(error);
        }
      }
    };

    const stopPolling = () => {
      isStopped = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Start polling
    poll(); // Initial poll
    pollInterval = setInterval(poll, interval);

    // Return cleanup function
    return stopPolling;
  }
}

export const taskService = new TaskService();
export default taskService;

