import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
} from "react";

const KeyboardContext = createContext();

// Threshold for detecting keyboard (keyboard is usually 200-400px tall)
const KEYBOARD_HEIGHT_THRESHOLD = 150;

export function KeyboardProvider({ children }) {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const activeInputRef = useRef(null);
    const initialViewportHeight = useRef(null);

    // Track viewport changes to detect keyboard
    useEffect(() => {
        // Store initial viewport height on mount
        if (window.visualViewport) {
            initialViewportHeight.current = window.visualViewport.height;
        } else {
            initialViewportHeight.current = window.innerHeight;
        }

        const handleViewportResize = () => {
            const currentHeight = window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

            // If viewport shrunk significantly, keyboard is open
            const heightDiff = initialViewportHeight.current - currentHeight;
            const keyboardVisible = heightDiff > KEYBOARD_HEIGHT_THRESHOLD;

            setIsKeyboardOpen(keyboardVisible);
        };

        // Use visualViewport API if available (more reliable)
        if (window.visualViewport) {
            window.visualViewport.addEventListener(
                "resize",
                handleViewportResize
            );
            return () => {
                window.visualViewport.removeEventListener(
                    "resize",
                    handleViewportResize
                );
            };
        } else {
            // Fallback for older browsers
            window.addEventListener("resize", handleViewportResize);
            return () => {
                window.removeEventListener("resize", handleViewportResize);
            };
        }
    }, []);

    // Called when input gains focus (for tracking active input)
    const setInputFocused = useCallback((inputRef) => {
        activeInputRef.current = inputRef;
    }, []);

    // Called when input loses focus
    const setInputBlurred = useCallback(() => {
        activeInputRef.current = null;
    }, []);

    // Blur the active input programmatically
    const blurInput = useCallback(() => {
        if (activeInputRef.current?.current?.blur) {
            activeInputRef.current.current.blur();
        }
        activeInputRef.current = null;
    }, []);

    return (
        <KeyboardContext.Provider
            value={{
                isKeyboardOpen,
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
