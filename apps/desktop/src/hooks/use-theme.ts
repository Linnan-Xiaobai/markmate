import { useEffect } from 'react';
import { useConfigStore } from '@/store/use-config-store';

export function useTheme() {
  const theme = useConfigStore((s) => s.config.theme);
  const isConfigLoaded = useConfigStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isConfigLoaded) return;

    const applyTheme = async () => {
      let resolvedTheme: 'light' | 'dark';

      if (theme === 'system') {
        // Use Electron nativeTheme to detect system theme
        try {
          const systemTheme = await window.markmate.app.getTheme();
          resolvedTheme = systemTheme;
        } catch {
          resolvedTheme = 'dark'; // Fallback
        }
      } else {
        resolvedTheme = theme;
      }

      // Apply to document root
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme();
  }, [theme, isConfigLoaded]);

  return theme;
}
