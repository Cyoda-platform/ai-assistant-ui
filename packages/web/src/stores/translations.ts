import {defineStore} from "pinia";
import publicClient from "@/clients/public";

const useTranslationsStore = defineStore('translations', {
  actions: {
    getLabelsConfig() {
      return publicClient.get(`/v1/labels_config`)
    },
    postLabelsConfigRefresh() {
      return publicClient.post(`/v1/labels_config/refresh`)
    }
  }
});

export default useTranslationsStore;
