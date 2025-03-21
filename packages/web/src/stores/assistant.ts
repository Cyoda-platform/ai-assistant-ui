import {defineStore} from "pinia";
import privateClient from "@/clients/private";
import type {CreateChatRequest, CreateChatResponse} from "@/types/chat";
import {ChatResponse} from "../types/chat";

const useAssistantStore = defineStore('assistant', {
  actions: {
    chats(data: CreateChatRequest) {
      return privateClient.post<CreateChatResponse>("/v1/chats", data);
    },
    getQuestions(technical_id: string) {
      return privateClient.get(`/v1/chats/${technical_id}/questions`);
    },
    postTextAnswers(technical_id: string, data: any) {
      return privateClient.post(`/v1/chats/${technical_id}/text-answers`, data)
    },
    postAnswers(technical_id: string, data: any) {
      return privateClient.post(`/v1/chats/${technical_id}/answers`, data)
    },
    postTextQuestions(technical_id: string, data: any) {
      return privateClient.post(`/v1/chats/${technical_id}/text-questions`, data)
    },
    postQuestions(technical_id: string, data: any) {
      return privateClient.post(`/v1/chats/${technical_id}/questions`, data)
    },
    getChats() {
      return privateClient.get<ChatResponse>(`/v1/chats`)
    },
    getChatById(technical_id: string) {
      return privateClient.get(`/v1/chats/${technical_id}`)
    },
    postRollbackQuestion(technical_id: string, event) {
      return privateClient.post(`/v1/chats/${technical_id}/rollback`, event)
    },
    postApproveQuestion(technical_id: string, event) {
      return privateClient.post(`/v1/chats/${technical_id}/approve`, event)
    },
    putNotification(technical_id: string, data) {
      return privateClient.put(`/v1/chats/${technical_id}/notification`, data)
    }
  }
});

export default useAssistantStore;
