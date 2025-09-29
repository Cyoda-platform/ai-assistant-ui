import {defineStore} from "pinia";
import HelperStorage from "@/helpers/HelperStorage.ts";

const helperStorage = new HelperStorage();

const useAppStore = defineStore('app', {
    state: () => {
        return {
            isSidebarHidden: helperStorage.get('app:isSidebarHidden', false),
            isCanvasHidden: helperStorage.get('app:isCanvasHidden', false),
            theme: helperStorage.get('app:theme', 'system'),
            consentDialog: helperStorage.get('app:consentDialog', true),
            workflowLayout: helperStorage.get('app:workflowLayout', 'vertical') as 'horizontal' | 'vertical',
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
        },
        setConsentDialog(value) {
            this.consentDialog = value;
            helperStorage.set("app:consentDialog", value);
        },
        setWorkflowLayout(layout: 'horizontal' | 'vertical') {
            this.workflowLayout = layout;
            helperStorage.set("app:workflowLayout", layout);
        }
    },
});

export default useAppStore;
