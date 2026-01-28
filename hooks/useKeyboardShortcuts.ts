import { useEffect } from "react";

type Shortcut = {
  key: string;
  meta?: boolean;
  action: () => void;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.meta && !(e.metaKey || e.ctrlKey)) continue;
        if (e.key === shortcut.key) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
