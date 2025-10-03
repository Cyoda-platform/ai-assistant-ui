import { create } from 'zustand';
import privateClient from "@/clients/private";
import type { CreateChatRequest, CreateChatResponse, ChatResponse, ChatData } from "@/types/chat";
import HelperStorage from "../helpers/HelperStorage";
import { useAuthStore } from "./auth";

const helperStorage = new HelperStorage();

interface AssistantStore {
  // State
  chatList: ChatData[] | null;
  chatListReady: boolean;
  guestChatsExist: boolean;
  isLoadingChats: boolean;
  isTransferringChats: boolean;

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
  getChats: () => Promise<any>;
  getChatById: (technical_id: string, params?: any) => Promise<any>;
  deleteChatById: (technical_id: string) => Promise<any>;
  renameChatById: (technical_id: string, data: any) => Promise<any>;
  postRollback: (technical_id: string) => Promise<any>;
  postApproveQuestion: (technical_id: string, event: any) => Promise<any>;
  putNotification: (technical_id: string, data: any) => Promise<any>;
  setGuestChatsExist: (value: boolean) => boolean;
  setIsTransferringChats: (value: boolean) => void;
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

  async getChats() {
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

      const response = await privateClient.get<ChatResponse>(`/v1/chats`, { params });
      set({ chatList: response.data.chats, chatListReady: true });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch chats:', error.message || error);
      // Don't set chatListReady to true on error
      throw error;
    } finally {
      set({ isLoadingChats: false });
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
  }
}));
