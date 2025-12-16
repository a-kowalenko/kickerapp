import { useContext, useEffect, useRef, useCallback } from "react";
import { createContext } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useUser } from "../features/authentication/useUser";
import { useQueryClient } from "react-query";

const KickerContext = createContext();

function KickerProvider({ children }) {
    const { isAuthenticated } = useUser();
    const queryClient = useQueryClient();
    const [currentKicker, setCurrentKicker] = useLocalStorageState(
        null,
        "currentKicker"
    );
    const currentKickerRef = useRef(currentKicker);
    const isAuthenticatedRef = useRef(isAuthenticated);
    const prevAuthenticatedRef = useRef(isAuthenticated);

    useEffect(() => {
        currentKickerRef.current = currentKicker;
        isAuthenticatedRef.current = isAuthenticated;
    }, [currentKicker, isAuthenticated]);

    // Reset currentKicker when user logs out (detect transition from authenticated to not authenticated)
    useEffect(() => {
        if (prevAuthenticatedRef.current && !isAuthenticated) {
            // User just logged out
            setCurrentKicker(null);
        }
        prevAuthenticatedRef.current = isAuthenticated;
    }, [isAuthenticated, setCurrentKicker]);

    // Sync with localStorage changes (e.g., from logout clearing localStorage directly)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "currentKicker") {
                const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                if (newValue !== currentKicker) {
                    setCurrentKicker(newValue);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [currentKicker, setCurrentKicker]);

    function handleKickerSelect(kicker) {
        queryClient.invalidateQueries(["matches"]);
        queryClient.invalidateQueries(["match"]);
        setCurrentKicker(kicker);
    }

    function tryToJoinKickerAfterLogin(
        kickerId,
        maxAttempts,
        interval,
        callback
    ) {
        let curAttempt = 0;

        function tryExecutingFunction() {
            if (curAttempt < maxAttempts) {
                setCurrentKicker(kickerId);
                curAttempt++;

                if (!isAuthenticatedRef.current || !currentKickerRef.current) {
                    setTimeout(tryExecutingFunction, interval);
                } else {
                    callback();
                }
            }
        }

        setTimeout(tryExecutingFunction, interval);
    }

    return (
        <KickerContext.Provider
            value={{
                currentKicker,
                setCurrentKicker: handleKickerSelect,
                tryToJoinKickerAfterLogin,
            }}
        >
            {children}
        </KickerContext.Provider>
    );
}

function useKicker() {
    const context = useContext(KickerContext);

    if (context === undefined) {
        throw new Error("KickerContext was used outside the KickerProvider");
    }

    const { currentKicker, setCurrentKicker, tryToJoinKickerAfterLogin } =
        context;

    return { currentKicker, setCurrentKicker, tryToJoinKickerAfterLogin };
}

export { KickerProvider, useKicker };
