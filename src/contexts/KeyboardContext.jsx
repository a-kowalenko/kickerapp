import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
} from "react";

const KeyboardContext = createContext();

export function KeyboardProvider({ children }) {
    const [isInputFocused, setIsInputFocused] = useState(false);
    const activeInputRef = useRef(null);

    // Called when input gains focus
    const setInputFocused = useCallback((inputRef) => {
        activeInputRef.current = inputRef;
        setIsInputFocused(true);
    }, []);

    // Called when input loses focus
    const setInputBlurred = useCallback(() => {
        activeInputRef.current = null;
        setIsInputFocused(false);
    }, []);

    // Blur the active input programmatically
    const blurInput = useCallback(() => {
        if (activeInputRef.current?.current?.blur) {
            activeInputRef.current.current.blur();
        }
        activeInputRef.current = null;
        setIsInputFocused(false);
    }, []);

    return (
        <KeyboardContext.Provider
            value={{
                isKeyboardOpen: isInputFocused,
                setInputFocused,
                setInputBlurred,
                blurInput,
            }}
        >
            {children}
        </KeyboardContext.Provider>
    );
}

export function useKeyboard() {
    const context = useContext(KeyboardContext);
    if (context === undefined) {
        throw new Error("useKeyboard must be used within a KeyboardProvider");
    }
    return context;
}
