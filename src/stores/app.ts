import {defineStore} from "pinia";
import HelperStorage from "@/helpers/HelperStorage.ts";

const helperStorage = new HelperStorage();

const useAppStore = defineStore('app', {
  state: () => {
    return {
      isSidebarHidden: helperStorage.get('app:isSidebarHidden', false),
      isCanvasHidden: helperStorage.get('app:isCanvasHidden', false),
    }
  },
  actions: {
    toggleSidebar() {
      this.isSidebarHidden = !this.isSidebarHidden;
      helperStorage.set("app:isSidebarHidden", this.isSidebarHidden);
    },
    toggleCanvas() {
      this.isCanvasHidden = !this.isCanvasHidden;
      helperStorage.set("app:isCanvasHidden", this.isCanvasHidden);
    },
  },
});

export default useAppStore;
