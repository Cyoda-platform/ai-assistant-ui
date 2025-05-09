import {defineStore} from "pinia";
import privateClient from "@/clients/private";

const useTranslationsStore = defineStore('translations', {
  actions: {
    getLabelsConfig() {
      return privateClient.get(`/v1/labels_config`)
    },
    postLabelsConfigRefresh() {
      return privateClient.post(`/v1/labels_config/refresh`)
    }
  }
});

export default useTranslationsStore;
