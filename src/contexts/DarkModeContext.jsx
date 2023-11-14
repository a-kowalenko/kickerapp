import { useEffect } from "react";
import { useContext } from "react";
import { createContext } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const DarkModeContext = createContext();

function DarkModeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useLocalStorageState(
        window.matchMedia("(prefers-color-scheme: dark").matches,
        "isDarkMode"
    );

    useEffect(
        function () {
            if (isDarkMode) {
                document.documentElement.classList.add("dark-mode");
                document.documentElement.classList.remove("light-mode");
            } else {
                document.documentElement.classList.remove("dark-mode");
                document.documentElement.classList.add("light-mode");
            }
        },
        [isDarkMode]
    );

    function toggleDarkMode() {
        setIsDarkMode((isDark) => !isDark);
    }

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
}

function useDarkMode() {
    const context = useContext(DarkModeContext);

    if (context === undefined) {
        throw new Error(
            "DarkModeContext was used outside the DarkModeProvider"
        );
    }

    return context;
}

export { DarkModeProvider, useDarkMode };
