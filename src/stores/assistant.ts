import {defineStore} from "pinia";
import privateClient from "@/clients/private";
import type {CreateChatRequest, CreateChatResponse} from "@/types/chat";

const useAssistantStore = defineStore('assistant', {
  actions: {
    chats(data: CreateChatRequest) {
      return privateClient.post<CreateChatResponse>("/v1/chats", data);
    },
    getQuestions(technical_id: string) {
      return privateClient.get(`/v1/chats/${technical_id}/questions`);
    },
    postTextAnswers(technical_id: string, answer: string) {
      return privateClient.post(`/v1/chats/${technical_id}/text-answers`, {answer})
    },
    postTextQuestions(technical_id: string, question: string) {
      return privateClient.post(`/v1/chats/${technical_id}/text-questions`, {question})
    },
    postPushNotify(technical_id: string) {
      return privateClient.post(`/v1/chats/${technical_id}/push-notify`)
    },
    postApprove(technical_id: string) {
      return privateClient.post(`/v1/chats/${technical_id}/approve`)
    },
    postRollback(technical_id: string) {
      return privateClient.post(`/v1/chats/${technical_id}/rollback`)
    }
  }
});

export default useAssistantStore;
