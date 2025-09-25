import { useMemo } from "react";
import { useAppStore } from "../stores/app";

export const useDetectTheme = function () {
    const appStore = useAppStore();

    // Simple dark mode detection
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = useMemo(() => {
        if (["dark", "light"].includes(appStore.theme)) {
            return appStore.theme;
        }
        return prefersDark ? "dark" : "light";
    }, [appStore.theme, prefersDark]);

    return theme;
};
