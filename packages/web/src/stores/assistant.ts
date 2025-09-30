import { create } from 'zustand';
import privateClient from "@/clients/private";
import type { CreateChatRequest, CreateChatResponse, ChatResponse, ChatData } from "@/types/chat";
import HelperStorage from "../helpers/HelperStorage";

const helperStorage = new HelperStorage();

interface AssistantStore {
  // State
  chatList: ChatData[] | null;
  chatListReady: boolean;
  guestChatsExist: boolean;
  isLoadingChats: boolean;

  // Getters
  isExistChats: boolean;
  isGuestChatsExist: boolean;

  // Actions
  postChats: (data: CreateChatRequest) => Promise<any>;
  postTextAnswers: (technical_id: string, data: any) => Promise<any>;
  postAnswers: (technical_id: string, data: any) => Promise<any>;
  postTextQuestions: (technical_id: string, data: any) => Promise<any>;
  postQuestions: (technical_id: string, data: any) => Promise<any>;
  getChats: () => Promise<any>;
  getChatById: (technical_id: string, params?: any) => Promise<any>;
  deleteChatById: (technical_id: string) => Promise<any>;
  renameChatById: (technical_id: string, data: any) => Promise<any>;
  postRollback: (technical_id: string) => Promise<any>;
  postApproveQuestion: (technical_id: string, event: any) => Promise<any>;
  putNotification: (technical_id: string, data: any) => Promise<any>;
  setGuestChatsExist: (value: boolean) => boolean;
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  // Initial state
  chatList: null,
  chatListReady: false,
  guestChatsExist: helperStorage.get('assistant:guestChatsExist', false),
  isLoadingChats: false,

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
    return privateClient.post(`/v1/chats/${technical_id}/text-questions`, data);
  },

  postQuestions(technical_id: string, data: any) {
    return privateClient.post(`/v1/chats/${technical_id}/questions`, data);
  },

  async getChats() {
    // Prevent concurrent calls
    const state = get();
    if (state.isLoadingChats) {
      console.log('⚠️ getChats already in progress, skipping duplicate call');
      return;
    }

    set({ isLoadingChats: true });
    try {
      const response = await privateClient.get<ChatResponse>(`/v1/chats`);
      set({ chatList: response.data.chats, chatListReady: true });
      return response;
    } finally {
      set({ isLoadingChats: false });
    }
  },

  getChatById(technical_id: string, params = {}) {
    return privateClient.get(`/v1/chats/${technical_id}`, params);
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
  }
}));
