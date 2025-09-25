import { create } from 'zustand';
import publicClient from "@/clients/public";

interface TranslationsStore {
  // Actions
  getLabelsConfig: () => Promise<any>;
  postLabelsConfigRefresh: () => Promise<any>;
}

export const useTranslationsStore = create<TranslationsStore>(() => ({
  // Actions
  getLabelsConfig() {
    return publicClient.get(`/v1/labels_config`);
  },

  postLabelsConfigRefresh() {
    return publicClient.post(`/v1/labels_config/refresh`);
  }
}));
