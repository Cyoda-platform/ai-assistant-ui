import {defineStore} from "pinia";
import HelperStorage from "@/helpers/HelperStorage.ts";

const helperStorage = new HelperStorage();

const useAppStore = defineStore('app', {
  state: () => {
    return {
      isSidebarHidden: helperStorage.get('app:isSidebarHidden', false),
      isCanvasHidden: helperStorage.get('app:isCanvasHidden', false),
      theme: helperStorage.get('app:theme', 'system'),
    }
  },
  actions: {
    toggleSidebar(value) {
      this.isSidebarHidden = value !== undefined ? value : !this.isSidebarHidden;
      helperStorage.set("app:isSidebarHidden", this.isSidebarHidden);
    },
    toggleCanvas() {
      this.isCanvasHidden = !this.isCanvasHidden;
      helperStorage.set("app:isCanvasHidden", this.isCanvasHidden);
    },
    setTheme(theme) {
      this.theme = theme;
      helperStorage.set("app:theme", theme);
    }
  },
});

export default useAppStore;
