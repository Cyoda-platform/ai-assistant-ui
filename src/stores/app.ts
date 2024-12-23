import {defineStore} from "pinia";
import privateClient from "@/clients/private";
import type {CreateChatRequest, CreateChatResponse} from "@/types/chat";
import HelperStorage from "@/helpers/HelperStorage.ts";

const helperStorage = new HelperStorage();

const useAppStore = defineStore('app', {
  state: () => {
    return {
      sidebarVisible: helperStorage.get('app:sidebarVisible', false),
      sidebarCanvasVisible: helperStorage.get('app:sidebarCanvasVisible', false),
    }
  },
  actions: {
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
      helperStorage.set("app:sidebarVisible", this.sidebarVisible);
    },
    toggleSidebarCanvas() {
      this.sidebarCanvasVisible = !this.sidebarCanvasVisible;
      helperStorage.set("app:sidebarCanvasVisible", this.sidebarCanvasVisible);
    },
  },
});

export default useAppStore;
