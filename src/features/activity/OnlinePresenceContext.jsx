import { createContext, useContext } from "react";
import { useOnlinePresence } from "./useOnlinePresence";

const OnlinePresenceContext = createContext(null);

/**
 * Provider that initializes online presence tracking
 * Should be placed high in the component tree so presence is tracked
 * regardless of which page/component the user is on (including mobile)
 */
export function OnlinePresenceProvider({ children }) {
    const presenceData = useOnlinePresence();

    return (
        <OnlinePresenceContext.Provider value={presenceData}>
            {children}
        </OnlinePresenceContext.Provider>
    );
}

/**
 * Hook to access online presence data from any component
 * Returns { onlinePlayers, isConnected, currentPlayerId }
 */
export function useOnlinePresenceContext() {
    const context = useContext(OnlinePresenceContext);

    if (context === undefined) {
        throw new Error(
            "useOnlinePresenceContext must be used within an OnlinePresenceProvider"
        );
    }

    return context;
}

export default OnlinePresenceProvider;
