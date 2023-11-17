import { useContext, useEffect } from "react";
import { createContext } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const KickerContext = createContext();

function KickerProvider({ children }) {
    const [currentKicker, setCurrentKicker] = useLocalStorageState(
        null,
        "currentKicker"
    );

    useEffect(() => {
        if (currentKicker) {
            localStorage.setItem("currentKicker", currentKicker);
        }
    }, [currentKicker]);

    return (
        <KickerContext.Provider value={{ currentKicker, setCurrentKicker }}>
            {children}
        </KickerContext.Provider>
    );
}

function useKicker() {
    const context = useContext(KickerContext);

    if (context === undefined) {
        throw new Error("KickerContext was used outside the KickerProvider");
    }

    const { currentKicker, setCurrentKicker } = context;

    return { currentKicker, setCurrentKicker };
}

export { KickerProvider, useKicker };
