import { useContext, useEffect, useRef } from "react";
import { createContext } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useUser } from "../features/authentication/useUser";

const KickerContext = createContext();

function KickerProvider({ children }) {
    const { isAuthenticated } = useUser();
    const [currentKicker, setCurrentKicker] = useLocalStorageState(
        null,
        "currentKicker"
    );
    const currentKickerRef = useRef(currentKicker);
    const isAuthenticatedRef = useRef(isAuthenticated);

    useEffect(() => {
        currentKickerRef.current = currentKicker;
        isAuthenticatedRef.current = isAuthenticated;
    }, [currentKicker, isAuthenticated]);

    useEffect(() => {
        if (currentKicker) {
            localStorage.setItem("currentKicker", currentKicker);
        }
    }, [currentKicker]);

    function tryToJoinKickerAfterLogin(
        kickerId,
        maxAttempts,
        interval,
        callback
    ) {
        console.log(
            "tryToJoinKickerAfterLogin",
            kickerId,
            maxAttempts,
            interval
        );
        let curAttempt = 0;

        function tryExecutingFunction() {
            if (curAttempt < maxAttempts) {
                console.log("curAttempt:", curAttempt);
                setCurrentKicker(kickerId);
                curAttempt++;

                console.log("isAuthenticated", isAuthenticatedRef.current);
                console.log("currentKicker", currentKickerRef.current);
                if (!isAuthenticatedRef.current || !currentKickerRef.current) {
                    console.log("RETRY LOGIN");
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
                setCurrentKicker,
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
