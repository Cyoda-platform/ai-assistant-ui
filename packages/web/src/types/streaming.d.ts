// SSE Event Types for Chat Streaming

export interface SSEBaseEvent {
  type: string;
  timestamp: string;
}

export interface SSEStartEvent extends SSEBaseEvent {
  type: 'start';
  message: string;
  conversation_id?: string;
  task_id?: string;
}

export interface SSEAgentEvent extends SSEBaseEvent {
  type: 'agent';
  agent_name: string;
  message: string;
}

export interface SSEToolEvent extends SSEBaseEvent {
  type: 'tool';
  tool_name: string;
  message: string;
}

export interface SSEToolCallEvent extends SSEBaseEvent {
  type: 'tool_call';
  tool_name: string;
  tool_args: Record<string, any>;
  tool_id: string;
  message: string;
  agent: string;
}

export interface SSEToolResponseEvent extends SSEBaseEvent {
  type: 'tool_response';
  tool_name: string;
  tool_response: any;
  tool_id: string;
  message: string;
  agent: string;
}

export interface SSEToolResponseStartEvent extends SSEBaseEvent {
  type: 'tool_response_start';
  tool_name: string;
  tool_id: string;
  message: string;
  agent: string;
}

export interface SSEToolResponseContentEvent extends SSEBaseEvent {
  type: 'tool_response_content';
  tool_name: string;
  chunk: string;
  accumulated_length: number;
  agent: string;
}

export interface SSEToolResponseEndEvent extends SSEBaseEvent {
  type: 'tool_response_end';
  tool_name: string;
  tool_id: string;
  message: string;
  agent: string;
  hook?: any;
}

export interface SSEAgentTransferEvent extends SSEBaseEvent {
  type: 'agent_transfer';
  from_agent: string;
  to_agent: string;
  message: string;
}

export interface SSECodeChangeEvent extends SSEBaseEvent {
  type: 'code_change';
  agent: string;
  message: string;
  changed_files?: string[];
  commit_sha?: string;
}

export interface SSEContentEvent extends SSEBaseEvent {
  type: 'content';
  chunk: string;
  accumulated_length: number;
}

export interface UIFunction {
  type: 'ui_function';
  function: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response_format: 'file' | 'json';
}

export interface SSEDoneEvent extends SSEBaseEvent {
  type: 'done';
  message: string;
  response: string;
  hook_message?: string; // Separated hook message from agent response
  adk_session_id?: string;
  ui_functions?: UIFunction[];
  total_events?: number;
  hook?: {
    background_task_ids?: string[];
    [key: string]: any;
  };
  // Enhanced error information
  error?: string;
  error_type?: string;
  error_context?: {
    events_processed: boolean;
    response_length: number;
    event_count: number;
    session_id?: string;
  };
}

export interface SSEErrorEvent extends SSEBaseEvent {
  type: 'error';
  error: string;
  message: string;
  error_type?: string;
  context?: string;
  status_code?: number;
  error_code?: string;
}

export interface SSEProgressEvent extends SSEBaseEvent {
  type: 'progress';
  task_id: string;
  progress: number;
  status: string;
  statistics?: {
    duration_seconds: number;
    estimated_remaining_seconds: number;
    status_message: string;
  };
}

export type SSEChatEvent =
  | SSEStartEvent
  | SSEAgentEvent
  | SSEToolEvent
  | SSEToolCallEvent
  | SSEToolResponseEvent
  | SSEToolResponseStartEvent
  | SSEToolResponseContentEvent
  | SSEToolResponseEndEvent
  | SSEAgentTransferEvent
  | SSECodeChangeEvent
  | SSEContentEvent
  | SSEDoneEvent
  | SSEErrorEvent;

export type SSETaskEvent =
  | SSEStartEvent
  | SSEProgressEvent
  | SSEDoneEvent
  | SSEErrorEvent;

export type SSEEvent = SSEChatEvent | SSETaskEvent;

// SSE Event for debug panel
export interface SSEEventRecord {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

// Streaming state for UI
export interface StreamingState {
  isStreaming: boolean;
  currentAgent?: string;
  currentTool?: string;
  toolArgs?: Record<string, any>;
  toolResponseContent?: string; // Accumulated tool response content for real-time display
  accumulatedContent: string;
  error?: string;
  errorDetails?: {
    error_type?: string;
    context?: string;
    status_code?: number;
    error_code?: string;
    error_context?: {
      events_processed: boolean;
      response_length: number;
      event_count: number;
      session_id?: string;
    };
  };
  events?: SSEEventRecord[]; // Track all events for debug panel
}

