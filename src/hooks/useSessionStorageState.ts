import { useId, useState, useEffect } from "react";

/**
 * This hook works just the same as `useState`, but it also stores the state in the session storage.
 * It uses `useId` from React to generate a unique key for the state.
 * 
 * In browsers without session storage support, it will fallback to `useState`.
 */
export const useSessionStorageState = <T>(initialState: T) => {
    const id = useId();
    const [state, setState] = useState(() => {
        try {
            const storedState = sessionStorage.getItem(id);
            return storedState ? JSON.parse(storedState) : initialState;
        } catch {
            return initialState;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(id, JSON.stringify(state));
        } catch {
        }
    }, [state]);

    return [state, setState] as const;
};