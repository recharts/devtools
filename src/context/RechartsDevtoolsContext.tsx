import React, { createContext, useContext, useId, useState, useEffect } from 'react';
import { RECHARTS_DEVTOOLS_PORTAL_ID } from '../constants.js';

const Context = createContext<string | null>(null);

interface RechartsDevtoolsContextProps {
    children: React.ReactNode;
}

export const RechartsDevtoolsContext: React.FC<RechartsDevtoolsContextProps> = ({ children }) => {
    // Generate a unique ID for this instance.
    // React.useId returns a string that includes colons, e.g., ":r0:"
    // We sanitize it to make it a valid HTML ID and safer for CSS selectors if needed.
    const rawId = useId();
    const portalId = `recharts-devtools-portal-${rawId.replace(/:/g, '')}`;

    return <Context.Provider value={portalId}>{children}</Context.Provider>;
};

export const useRechartsDevtoolsContext = (): string | null => {
    return useContext(Context);
};

export const RechartsDevtoolsPortal: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
    const contextId = useRechartsDevtoolsContext();
    const id = contextId ?? RECHARTS_DEVTOOLS_PORTAL_ID;

    return <div id={id} {...props} />;
};
