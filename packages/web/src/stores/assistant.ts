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

  async getChats(reset = false) {
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

      // Build query params
      const params: any = {};
      if (isSuperMode) {
        params.super = 'true';
      }

      // Reset pagination if requested
      if (reset) {
        set({ chatList: null, nextCursor: null, hasMoreChats: false });
      }

      console.log('📋 Fetching chats from server...');
      const response = await privateClient.get<ChatResponse>(`/v1/chats`, { params });
      console.log('📋 Received chats from server:', response.data.chats);

      // Update state with pagination info
      set({
        chatList: response.data.chats,
        chatListReady: true,
        nextCursor: response.data.next_cursor || null,
        hasMoreChats: response.data.has_more || false
      });
      console.log('✅ Updated chatList in store, new state:', get().chatList);

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

    // Prevent concurrent calls
    if (state.isLoadingMoreChats || state.isLoadingChats) {
      return;
    }

    // Check if there are more chats to load
    if (!state.hasMoreChats || !state.nextCursor) {
      console.log('📋 No more chats to load');
      return;
    }

    set({ isLoadingMoreChats: true });
    try {
      // Check if super user mode is enabled
      const authState = useAuthStore.getState();
      const isSuperMode = authState.superUserMode && authState.isCyodaEmployee;

      // Build query params with cursor
      const params: any = {
        before: state.nextCursor
      };
      if (isSuperMode) {
        params.super = 'true';
      }

      console.log('📋 Loading more chats with cursor:', state.nextCursor);
      const response = await privateClient.get<ChatResponse>(`/v1/chats`, { params });

      // Append new chats to existing list
      const currentChats = state.chatList || [];
      const newChats = response.data.chats || [];

      set({
        chatList: [...currentChats, ...newChats],
        nextCursor: response.data.next_cursor || null,
        hasMoreChats: response.data.has_more || false
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

  async deleteChatById(technical_id: string) {
    console.log('🔄 deleteChatById - Deleting chat:', { technical_id });
    try {
      const response = await privateClient.delete(`/v1/chats/${technical_id}`);
      console.log('✅ deleteChatById - Server response:', response);

      // Update the chat list by removing the deleted chat
      const state = get();
      if (state.chatList) {
        const updatedChatList = state.chatList.filter(chat => chat.technical_id !== technical_id);
        set({ chatList: updatedChatList });
        console.log('✅ Updated local chatList after delete');
      }

      return response;
    } catch (error) {
      console.error('❌ deleteChatById - Error:', error);
      throw error;
    }
  },

  async renameChatById(technical_id: string, data: any) {
    console.log('🔄 renameChatById - Sending to server:', { technical_id, data });
    const response = await privateClient.put(`/v1/chats/${technical_id}`, data);
    console.log('🔄 renameChatById - Server response:', response);
    console.log('🔄 renameChatById - response.data:', response.data);

    // Update the chat list with the new name
    const state = get();
    if (state.chatList) {
      const updatedChatList = state.chatList.map(chat =>
        chat.technical_id === technical_id
          ? { ...chat, name: data.name }
          : chat
      );
      set({ chatList: updatedChatList });
      console.log('✅ Updated local chatList after rename');
    }

    return response;
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
