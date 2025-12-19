import { create } from 'zustand';
import privateClient from "@/clients/private";
import type { CreateChatRequest, CreateChatResponse, ChatResponse, ChatData } from "@/types/chat";
import type { SSEChatEvent } from "@/types/streaming";
import HelperStorage from "../helpers/HelperStorage";
import { useAuthStore } from "./auth";
import streamingService from "@/services/streamingService";

const helperStorage = new HelperStorage();

interface AssistantStore {
  // State
  chatList: ChatData[] | null;
  chatListReady: boolean;
  guestChatsExist: boolean;
  isLoadingChats: boolean;
  isTransferringChats: boolean;
  nextCursor: string | null;
  hasMoreChats: boolean;
  isLoadingMoreChats: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  nextWindowStart: string | null;

  // Getters
  isExistChats: boolean;
  isGuestChatsExist: boolean;

  // Actions
  postChats: (data: CreateChatRequest) => Promise<any>;
  postTextAnswers: (technical_id: string, data: any) => Promise<any>;
  postAnswers: (technical_id: string, data: any) => Promise<any>;
  postTextQuestions: (technical_id: string, data: any) => Promise<any>;
  postQuestions: (technical_id: string, data: any) => Promise<any>;
  postWorkflowQuestions: (data: any) => Promise<any>;
  postCanvasQuestion: (data: any) => Promise<any>;
  getChats: (reset?: boolean) => Promise<any>;
  loadMoreChats: () => Promise<any>;
  getChatById: (technical_id: string, params?: any) => Promise<any>;
  deleteChatById: (technical_id: string) => Promise<any>;
  renameChatById: (technical_id: string, data: any) => Promise<any>;
  postRollback: (technical_id: string) => Promise<any>;
  postApproveQuestion: (technical_id: string, event: any) => Promise<any>;
  putNotification: (technical_id: string, data: any) => Promise<any>;
  setGuestChatsExist: (value: boolean) => boolean;
  setIsTransferringChats: (value: boolean) => void;

  // Streaming Actions
  streamChatMessage: (
    conversationId: string,
    message: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    files?: File[]
  ) => Promise<AbortController>;

  retryChatMessage: (
    conversationId: string,
    message: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ) => Promise<AbortController>;
}

// Check if we're in the middle of an Auth0 login flow
// If we have a guest token and the URL contains Auth0 callback params, we're transferring
const isInLoginFlow = () => {
  const authState = useAuthStore.getState();
  const hasGuestToken = authState.token && authState.tokenType === 'public';
  const urlParams = new URLSearchParams(window.location.search);
  const hasAuthParams = urlParams.has('code') && urlParams.has('state');
  return hasGuestToken && hasAuthParams;
};

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  // Initial state
  chatList: null,
  chatListReady: false,
  guestChatsExist: helperStorage.get('assistant:guestChatsExist', false),
  isLoadingChats: false,
  isTransferringChats: isInLoginFlow(), // Start as true if we're in login flow
  nextCursor: null,
  hasMoreChats: false,
  isLoadingMoreChats: false,
  windowStart: null,
  windowEnd: null,
  nextWindowStart: null,
  nextWindowEnd: null,

  // Getters
  get isExistChats() {
    const state = get();
    return state.chatList?.length > 0;
  },

  get isGuestChatsExist() {
    const state = get();
    return state.guestChatsExist;
  },

  // Actions
  postChats(data: CreateChatRequest) {
    return privateClient.post<CreateChatResponse>("/v1/chats", data);
  },

  postTextAnswers(technical_id: string, data: any) {
    return privateClient.post(`/v1/chats/${technical_id}/text-answers`, data);
  },

  postAnswers(technical_id: string, data: any) {
    return privateClient.post(`/v1/chats/${technical_id}/answers`, data);
  },

  postTextQuestions(technical_id: string, data: any) {
    return privateClient.post(`/v1/chats/text-questions`, data);
  },

  postQuestions(technical_id: string, data: any) {
    return privateClient.post(`/v1/chats/questions`, data);
  },

  postWorkflowQuestions(data: any) {
    return privateClient.post(`/v1/chats/workflow-questions`, data);
  },

  postCanvasQuestion(data: any) {
    return privateClient.post(`/v1/chats/canvas-questions`, data);
  },

  async getChats(reset = false, windowStart?: string, windowEnd?: string) {
    // Prevent concurrent calls
    const state = get();
    if (state.isLoadingChats) {
      return;
    }

    // Skip if currently transferring chats
    if (state.isTransferringChats) {
      return;
    }

    set({ isLoadingChats: true });
    try {
      // Check if super user mode is enabled
      const authState = useAuthStore.getState();
      const isSuperMode = authState.superUserMode && authState.isCyodaEmployee;

      // Reset pagination if requested
      if (reset) {
        set({ chatList: null, windowStart: null, windowEnd: null, nextWindowStart: null, nextWindowEnd: null, hasMoreChats: false });
      }

      // Build query params
      const params: any = {};
      if (isSuperMode) {
        params.super = 'true';
      }

      // Use provided windowStart or default to tomorrow at midnight UTC (end of today)
      if (!windowStart) {
        const tomorrow = new Date();
        tomorrow.setUTCHours(0, 0, 0, 0);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const year = tomorrow.getUTCFullYear();
        const month = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getUTCDate()).padStart(2, '0');
        windowStart = `${year}-${month}-${day}T00:00:00+00:00`;
      }

      // Use provided windowEnd or calculate as windowStart - 1 day
      if (!windowEnd) {
        const endDate = new Date(windowStart);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        const year = endDate.getUTCFullYear();
        const month = String(endDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(endDate.getUTCDate()).padStart(2, '0');
        windowEnd = `${year}-${month}-${day}T00:00:00+00:00`;
      }

      params.window_start = windowStart;
      params.window_end = windowEnd;

      console.log('📋 Loading chats for range:', windowEnd, '<', 'date', '<=', windowStart);
      const response = await privateClient.get<ChatResponse>(`/v1/chats`, { params });

      // Update state with pagination info
      set({
        chatList: response.data.chats,
        chatListReady: true,
        windowStart: response.data.window_start || null,
        windowEnd: response.data.window_end || null,
        nextWindowStart: response.data.next_window_start || null,
        nextWindowEnd: response.data.next_window_end || null
      });

      console.log('📋 Loaded chats. Next window:', response.data.next_window_end, '<', 'date', '<=', response.data.next_window_start);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch chats:', error.message || error);
      // Don't set chatListReady to true on error
      throw error;
    } finally {
      set({ isLoadingChats: false });
    }
  },

  async loadMoreChats() {
    const state = get();

    // Check if we have a next window to load
    if (!state.nextWindowStart || !state.nextWindowEnd) {
      console.log('📋 No next window available');
      return;
    }

    set({ isLoadingMoreChats: true });
    try {
      console.log('📋 Loading more chats for window:', state.nextWindowEnd, '<', 'date', '<=', state.nextWindowStart);

      // Use same getChats function with nextWindowStart and nextWindowEnd
      const response = await this.getChats(false, state.nextWindowStart, state.nextWindowEnd);

      // Append new chats to existing list instead of replacing
      const currentChats = state.chatList || [];
      const newChats = response?.data.chats || [];

      set({
        chatList: [...currentChats, ...newChats]
      });

      console.log(`✅ Loaded ${newChats.length} more chats. Total: ${currentChats.length + newChats.length}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to load more chats:', error.message || error);
      throw error;
    } finally {
      set({ isLoadingMoreChats: false });
    }
  },

  getChatById(technical_id: string, params = {}) {
    // Check if super user mode is enabled
    const authState = useAuthStore.getState();
    const isSuperMode = authState.superUserMode && authState.isCyodaEmployee;

    // Build the config object for axios
    const config: any = { ...params };

    // Add super query parameter if in super user mode
    if (isSuperMode) {
      config.params = {
        ...(config.params || {}),
        super: 'true'
      };
    }

    return privateClient.get(`/v1/chats/${technical_id}`, config);
  },

  deleteChatById(technical_id: string) {
    return privateClient.delete(`/v1/chats/${technical_id}`);
  },

  renameChatById(technical_id: string, data: any) {
    return privateClient.put(`/v1/chats/${technical_id}`, data);
  },

  postRollback(technical_id: string) {
    return privateClient.post(`/v1/chats/${technical_id}/rollback`);
  },

  postApproveQuestion(technical_id: string, event: any) {
    return privateClient.post(`/v1/chats/${technical_id}/approve`, event);
  },

  putNotification(technical_id: string, data: any) {
    return privateClient.put(`/v1/chats/${technical_id}/notification`, data);
  },

  setGuestChatsExist(value: boolean) {
    helperStorage.set('assistant:guestChatsExist', value);
    set({ guestChatsExist: value });
    return value;
  },

  setIsTransferringChats(value: boolean) {
    set({ isTransferringChats: value });
  },

  // Streaming Actions
  async streamChatMessage(
    conversationId: string,
    message: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    files?: File[]
  ) {
    const authState = useAuthStore.getState();
    const token = authState.token || '';

    return streamingService.streamChatMessage(
      conversationId,
      message,
      token,
      onEvent,
      onError,
      onComplete,
      files
    );
  },

  // Retry streaming method
  async retryChatMessage(
    conversationId: string,
    message: string,
    onEvent: (event: SSEChatEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ) {
    const authState = useAuthStore.getState();
    const token = authState.token || '';

    return streamingService.retryChatMessage(
      conversationId,
      message,
      token,
      onEvent,
      onError,
      onComplete
    );
  }
}));
