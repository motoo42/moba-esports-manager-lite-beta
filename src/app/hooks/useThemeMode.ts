import { useEffect } from "react";
import type { ThemeMode } from "../../domain/settings/appSettings";

type UseThemeModeOptions = {
  mode: ThemeMode;
};

export function useThemeMode({ mode }: UseThemeModeOptions) {
  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = mode;
    root.style.colorScheme = mode;
  }, [mode]);
}
