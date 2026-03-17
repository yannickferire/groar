import { useEffect } from "react";

type Shortcut = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  /** Only trigger when no text is selected and focus is not in an input */
  whenIdle?: boolean;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.meta && !(e.metaKey || e.ctrlKey)) continue;
        if (shortcut.shift && !e.shiftKey) continue;
        if (!shortcut.shift && e.shiftKey) continue;
        if (e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          if (shortcut.whenIdle) {
            const sel = window.getSelection();
            const hasSelection = sel && sel.toString().length > 0;
            const tag = (e.target as HTMLElement)?.tagName;
            const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
            if (hasSelection || isInput) continue;
          }
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
