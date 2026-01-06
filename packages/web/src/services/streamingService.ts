import { SSEEvent, SSEChatEvent, SSETaskEvent } from '@/types/streaming';

/**
 * SSE Streaming Service
 * Handles Server-Sent Events for real-time chat and task progress updates
 */
class StreamingService {
  private readonly TIMEOUT_MS = 600000; // 10 minutes (matches server STREAM_TIMEOUT)
  private readonly MAX_RECONNECT_ATTEMPTS = 2; // Reduced from 5 - prevent concurrent requests instead
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly PERSISTENCE_KEY_PREFIX = 'stream_state_';
  private readonly MAX_CONTENT_SIZE = 1024 * 1024; // 1MB limit for accumulated content
  private reconnectAttempts = 0;

  // Stream persistence storage
  private streamStates = new Map<string, {
    accumulatedContent: string;
    lastEventId: string;
    timestamp: number;
    conversationId: string;
    message: string;
  }>();

  // Active streams tracking to prevent concurrent requests
  private activeStreams = new Map<string, AbortController>();

  // Circuit breaker state
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    failureThreshold: 5,
    recoveryTimeout: 120000, // 2 minute
  };

  // Health monitoring
  private healthStats = {
    totalStreams: 0,
    successfulStreams: 0,
    failedStreams: 0,
    averageStreamDuration: 0,
    lastHealthCheck: Date.now(),
  };
  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(): boolean {
    const now = Date.now();

    if (this.circuitBreaker.state === 'OPEN') {
      if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.recoveryTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('[Circuit Breaker] Moving to HALF_OPEN state');
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record circuit breaker success
   */
  private recordSuccess() {
    console.log('[SSE] Recording success, resetting circuit breaker');
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
    this.healthStats.successfulStreams++;
  }

  /**
   * Record circuit breaker failure
   */
  private recordFailure() {
    console.log('[SSE] Recording failure, incrementing circuit breaker failures');
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    this.healthStats.failedStreams++;

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      console.warn(`[Circuit Breaker] OPEN - ${this.circuitBreaker.failures} consecutive failures`);
    }
  }

  /**
   * Stream chat message with real-time updates
   * Uses fetch with ReadableStream to support POST requests
   * Supports optional file attachments via multipart/form-data
   */
  async streamChatMessage(
    conversationId: string,
    message: string,
    token: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    files?: File[],
    adkSessionId?: string
  ): Promise<AbortController> {
    // Check if there's already an active stream for this conversation
    const existingStream = this.activeStreams.get(conversationId);
    if (existingStream) {
      console.log(`[SSE] Aborting existing stream for conversation ${conversationId}`);
      existingStream.abort();
      this.activeStreams.delete(conversationId);
    }

    // Periodic cleanup of old states
    this.cleanupOldStates();
    // Check circuit breaker
    console.log('[SSE] Circuit breaker state:', this.circuitBreaker);
    if (!this.checkCircuitBreaker()) {
      const error = new Error('Circuit breaker is OPEN - streaming service temporarily unavailable');
      error.name = 'CircuitBreakerError';
      console.error('[SSE] Circuit breaker blocked request:', error);
      onError?.(error);
      throw error;
    }

    this.healthStats.totalStreams++;
    const startTime = Date.now();

    const wrappedOnComplete = () => {
      this.recordSuccess();
      const duration = Date.now() - startTime;
      this.healthStats.averageStreamDuration =
        (this.healthStats.averageStreamDuration * (this.healthStats.successfulStreams - 1) + duration) /
        this.healthStats.successfulStreams;
      // Remove from active streams
      this.activeStreams.delete(conversationId);
      onComplete?.();
    };

    const wrappedOnError = (error: Error) => {
      this.recordFailure();
      // Remove from active streams
      this.activeStreams.delete(conversationId);
      onError?.(error);
    };

    return this.streamChatMessageWithRetry(conversationId, message, token, onEvent, wrappedOnError, wrappedOnComplete, 1, files, adkSessionId);
  }

  /**
   * Save stream state for recovery
   */
  private saveStreamState(conversationId: string, message: string, accumulatedContent: string, lastEventId: string) {
    const state = {
      accumulatedContent,
      lastEventId,
      timestamp: Date.now(),
      conversationId,
      message
    };

    this.streamStates.set(conversationId, state);

    // Also persist to localStorage for browser refresh recovery
    try {
      localStorage.setItem(
        `${this.PERSISTENCE_KEY_PREFIX}${conversationId}`,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn('Failed to persist stream state to localStorage:', error);
    }
  }

  /**
   * Load stream state for recovery
   */
  private loadStreamState(conversationId: string): {
    accumulatedContent: string;
    lastEventId: string;
    timestamp: number;
    conversationId: string;
    message: string;
  } | null {
    // First check memory
    let state = this.streamStates.get(conversationId);

    // If not in memory, try localStorage
    if (!state) {
      try {
        const stored = localStorage.getItem(`${this.PERSISTENCE_KEY_PREFIX}${conversationId}`);
        if (stored) {
          state = JSON.parse(stored);
          // Only use if less than 5 minutes old
          if (state && Date.now() - state.timestamp < 300000) {
            this.streamStates.set(conversationId, state);
          } else {
            state = null;
          }
        }
      } catch (error) {
        console.warn('Failed to load stream state from localStorage:', error);
      }
    }

    return state || null;
  }

  /**
   * Clear stream state after successful completion
   */
  private clearStreamState(conversationId: string) {
    this.streamStates.delete(conversationId);
    try {
      localStorage.removeItem(`${this.PERSISTENCE_KEY_PREFIX}${conversationId}`);
    } catch (error) {
      console.warn('Failed to clear stream state from localStorage:', error);
    }
  }

  /**
   * Stream chat message with retry logic and persistence
   * Supports optional file attachments
   */
  private async streamChatMessageWithRetry(
    conversationId: string,
    message: string,
    token: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    attemptNumber: number = 1,
    files?: File[],
    adkSessionId?: string
  ): Promise<AbortController> {
    const url = `${import.meta.env.VITE_APP_API_BASE}/v1/chats/${conversationId}/stream`;
    const abortController = new AbortController();

    // Register this stream as active
    this.activeStreams.set(conversationId, abortController);

    // Load previous stream state for recovery
    const previousState = this.loadStreamState(conversationId);
    let accumulatedContent = previousState?.accumulatedContent || '';
    let lastEventId = previousState?.lastEventId || '';
    let currentEventId = lastEventId; // Declare here so it's accessible in catch block

    // If we have previous content, emit it first for continuity
    if (previousState && previousState.accumulatedContent) {
      console.log(`[SSE] Recovering ${previousState.accumulatedContent.length} chars from previous stream`);
      onEvent({
        type: 'content',
        chunk: '', // Empty chunk, just to show accumulated content
        accumulated_length: previousState.accumulatedContent.length,
        timestamp: new Date().toISOString()
      });
    }

    // Set up timeout with longer duration for retries
    const timeoutMs = this.TIMEOUT_MS + (attemptNumber - 1) * 30000; // Add 30s per retry
    const timeoutId = setTimeout(() => {
      abortController.abort();
      const timeoutError = new Error(`Stream timeout after ${timeoutMs}ms (attempt ${attemptNumber})`);
      timeoutError.name = 'TimeoutError';
      onError?.(timeoutError);
    }, timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      };

      // Add Last-Event-ID header for stream resumption if we have it
      if (lastEventId) {
        headers['Last-Event-ID'] = lastEventId;
      }

      // Prepare request body - use FormData if files present, JSON otherwise
      let body: FormData | string;
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('message', message);
        if (adkSessionId) {
          formData.append('adk_session_id', adkSessionId);
        }
        files.forEach((file) => {
          formData.append('files', file);
        });
        body = formData;
        // Don't set Content-Type header - browser will set it with boundary
      } else {
        headers['Content-Type'] = 'application/json';
        const requestBody: { message: string; adk_session_id?: string } = { message };
        if (adkSessionId) {
          requestBody.adk_session_id = adkSessionId;
        }
        body = JSON.stringify(requestBody);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // currentEventId already declared at function scope

      // Read stream
      while (true) {
        const { done, value } = await reader.read();

        // Decode chunk and add to buffer (even if done, there might be final data)
        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        // Process complete SSE messages (separated by \n\n)
        const lines = buffer.split('\n\n');

        // If stream is done, process all remaining lines including the last one
        // Otherwise, keep the last incomplete line in the buffer
        if (!done) {
          buffer = lines.pop() || ''; // Keep incomplete message in buffer
        } else {
          buffer = ''; // Process everything when stream is done
        }

        for (const line of lines) {
          if (line.trim()) {
            console.log(`[SSE] Processing line:`, line);
            try {
              const event = this.parseSSEMessage(line);
              if (event) {
                console.log(`[SSE] Parsed event:`, event);

                // Track event ID for resumption
                if (event.id) {
                  currentEventId = event.id;
                }

                // Accumulate content for persistence with size limit
                if (event.type === 'content' && event.chunk) {
                  // Check memory limit before accumulating
                  if (accumulatedContent.length + event.chunk.length <= this.MAX_CONTENT_SIZE) {
                    accumulatedContent += event.chunk;
                    this.saveStreamState(conversationId, message, accumulatedContent, currentEventId);
                  } else {
                    console.warn(`[SSE] Content size limit reached (${this.MAX_CONTENT_SIZE} bytes), skipping persistence`);
                  }
                }

                console.log(`[SSE] Calling onEvent with:`, event);
                onEvent(event as SSEChatEvent);
              } else {
                console.warn(`[SSE] Failed to parse event from line:`, line);
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error, line);
            }
          }
        }

        // Check if stream is done AFTER processing all buffered data
        if (done) {
          console.log('[SSE] Stream completed successfully - all events processed');
          clearTimeout(timeoutId);
          this.reconnectAttempts = 0; // Reset on successful completion
          this.clearStreamState(conversationId); // Clear persistence on success
          onComplete?.();
          break;
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Stream error:', error);

        // Save current state before retry
        this.saveStreamState(conversationId, message, accumulatedContent, currentEventId);

        // Attempt retry if we haven't exceeded max attempts
        if (attemptNumber < this.MAX_RECONNECT_ATTEMPTS) {
          // Enhanced exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attemptNumber - 1);
          const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
          const delay = Math.min(baseDelay + jitter, 30000); // Max 30 seconds

          console.log(`Retrying stream in ${Math.round(delay)}ms (attempt ${attemptNumber + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
          console.log(`Preserved ${accumulatedContent.length} characters for recovery`);

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.streamChatMessageWithRetry(conversationId, message, token, onEvent, onError, onComplete, attemptNumber + 1, files, adkSessionId);
        } else {
          console.error('Max reconnection attempts reached');

          // Provide enhanced error information
          const enhancedError = new Error(
            `Stream failed after ${this.MAX_RECONNECT_ATTEMPTS} attempts. ` +
            `Preserved ${accumulatedContent.length} characters. ` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`
          );
          enhancedError.name = 'StreamExhaustedError';

          onError?.(enhancedError);
        }
      }
    }

    return abortController;
  }

  /**
   * Stream task progress updates
   * Uses EventSource for GET requests
   */
  streamTaskProgress(
    taskId: string,
    token: string,
    onEvent: (event: SSETaskEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    pollInterval: number = 3
  ): EventSource {
    const url = `${import.meta.env.VITE_APP_API_BASE}/v1/tasks/${taskId}/stream?poll_interval=${pollInterval}`;

    // Note: EventSource doesn't support custom headers directly
    // For authenticated requests, we need to use a different approach
    // or pass the token as a query parameter (less secure)
    const eventSource = new EventSource(url);

    eventSource.addEventListener('start', (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ ...data, type: 'start' } as SSETaskEvent);
      } catch (error) {
        console.error('Error parsing start event:', error);
      }
    });

    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ ...data, type: 'progress' } as SSETaskEvent);
      } catch (error) {
        console.error('Error parsing progress event:', error);
      }
    });

    eventSource.addEventListener('done', (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ ...data, type: 'done' } as SSETaskEvent);
        onComplete?.();
        eventSource.close();
      } catch (error) {
        console.error('Error parsing done event:', error);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onEvent({ ...data, type: 'error' } as SSETaskEvent);
        eventSource.close();
      } catch (error) {
        console.error('Error parsing error event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      onError?.(new Error('SSE connection failed'));
    };

    return eventSource;
  }

  /**
   * Parse SSE message format
   * Format:
   *   event: <event_type>
   *   data: <json_data>
   *   id: <optional_id>
   */
  private parseSSEMessage(message: string): SSEEvent | null {
    const lines = message.split('\n');
    let eventType = 'message';
    let eventData: any = null;
    let eventId: string | null = null;

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.substring(7).trim();
      } else if (line.startsWith('data: ')) {
        try {
          eventData = JSON.parse(line.substring(6));
        } catch (error) {
          console.error('Error parsing event data:', error);
          return null;
        }
      } else if (line.startsWith('id: ')) {
        eventId = line.substring(4).trim();
      }
    }

    if (!eventData) {
      return null;
    }

    // Ensure type is set
    if (!eventData.type) {
      eventData.type = eventType;
    }

    // Add event ID to the event data for tracking
    if (eventId) {
      eventData.id = eventId;
    }

    return eventData as SSEEvent;
  }

  /**
   * Abort a streaming connection
   */
  abortStream(controller: AbortController) {
    controller.abort();
  }

  /**
   * Close an EventSource connection
   */
  closeEventSource(eventSource: EventSource) {
    eventSource.close();
  }

  /**
   * Reset reconnection attempts (useful for manual retry)
   */
  resetReconnectionAttempts() {
    this.reconnectAttempts = 0;
  }

  /**
   * Manual retry for chat streaming
   */
  async retryChatMessage(
    conversationId: string,
    message: string,
    token: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<AbortController> {
    this.resetReconnectionAttempts();
    // Reset circuit breaker on manual retry
    if (this.circuitBreaker.state === 'OPEN') {
      this.circuitBreaker.state = 'HALF_OPEN';
      console.log('[Circuit Breaker] Manual retry - moving to HALF_OPEN state');
    }
    return this.streamChatMessage(conversationId, message, token, onEvent, onError, onComplete);
  }

  /**
   * Get streaming service health status
   */
  getHealthStatus() {
    const now = Date.now();
    const successRate = this.healthStats.totalStreams > 0
      ? (this.healthStats.successfulStreams / this.healthStats.totalStreams) * 100
      : 100;

    return {
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        threshold: this.circuitBreaker.failureThreshold,
        lastFailureTime: this.circuitBreaker.lastFailureTime,
        nextRetryTime: this.circuitBreaker.state === 'OPEN'
          ? this.circuitBreaker.lastFailureTime + this.circuitBreaker.recoveryTimeout
          : null,
      },
      stats: {
        ...this.healthStats,
        successRate: Math.round(successRate * 100) / 100,
        uptime: now - this.healthStats.lastHealthCheck,
      },
      activeStreams: this.streamStates.size,
    };
  }

  /**
   * Reset circuit breaker (for admin/debug purposes)
   */
  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.lastFailureTime = 0;
    console.log('[Circuit Breaker] Manually reset to CLOSED state');
  }

  /**
   * Clear old stream states (cleanup)
   */
  cleanupOldStates() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [conversationId, state] of this.streamStates.entries()) {
      if (now - state.timestamp > maxAge) {
        this.streamStates.delete(conversationId);
        try {
          localStorage.removeItem(`${this.PERSISTENCE_KEY_PREFIX}${conversationId}`);
        } catch (error) {
          console.warn('Failed to cleanup old stream state:', error);
        }
      }
    }
  }
}

export const streamingService = new StreamingService();
export default streamingService;

