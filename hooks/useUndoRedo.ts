import { useState, useCallback, useRef } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

export function useUndoRedo<T>(initialState: T, maxHistory = 50) {
  const [state, setStateRaw] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const stateRef = useRef<T>(initialState);
  stateRef.current = state;

  const setState = useCallback((action: SetStateAction<T>) => {
    const current = stateRef.current;
    const newState = typeof action === "function"
      ? (action as (prev: T) => T)(current)
      : action;

    // Push current to past, clear future
    pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), current];
    futureRef.current = [];
    setStateRaw(newState);
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, stateRef.current];
    setStateRaw(previous);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, stateRef.current];
    setStateRaw(next);
  }, []);

  // Reset state without creating history (for initial load from localStorage)
  const reset = useCallback((newState: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setStateRaw(newState);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
