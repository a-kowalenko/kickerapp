import { createContext, useCallback, useContext, useRef } from "react";

const DropdownContext = createContext();

/**
 * Context provider that ensures only one dropdown can be open at a time.
 * When a dropdown opens, all other dropdowns are automatically closed.
 */
function DropdownProvider({ children }) {
    // Store close functions from all registered dropdowns
    const closeCallbacksRef = useRef(new Set());

    // Register a dropdown's close function
    const registerDropdown = useCallback((closeCallback) => {
        closeCallbacksRef.current.add(closeCallback);
        // Return unregister function
        return () => {
            closeCallbacksRef.current.delete(closeCallback);
        };
    }, []);

    // Close all dropdowns except the one that's opening
    const closeAllExcept = useCallback((exceptCallback) => {
        closeCallbacksRef.current.forEach((closeCallback) => {
            if (closeCallback !== exceptCallback) {
                closeCallback();
            }
        });
    }, []);

    return (
        <DropdownContext.Provider value={{ registerDropdown, closeAllExcept }}>
            {children}
        </DropdownContext.Provider>
    );
}

function useDropdownContext() {
    return useContext(DropdownContext);
}

export { DropdownProvider, useDropdownContext };
