import { computed } from "vue";
import useAppStore from "../stores/app";
import { usePreferredDark } from "@vueuse/core";

export const useDetectTheme = function () {
    const appStore = useAppStore();
    const isDark = usePreferredDark();

    const theme = computed(() => {
        if (["dark", "light"].includes(appStore.theme)) {
            return appStore.theme;
        }
        return isDark.value ? "dark" : "light";
    });

    return theme;
};