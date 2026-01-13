import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";

const ScrollMemoryContext = createContext();

// Schneller smooth scroll (ca. 150ms)
function smoothScrollToTop(duration = 200) {
    const start = window.scrollY;
    if (start === 0) return;

    const startTime = performance.now();

    function scroll() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: ease-out quad
        const easeOut = 1 - (1 - progress) * (1 - progress);

        window.scrollTo(0, start * (1 - easeOut));

        if (progress < 1) {
            requestAnimationFrame(scroll);
        }
    }

    requestAnimationFrame(scroll);
}

function ScrollMemoryProvider({ children }) {
    const scrollPositions = useRef(new Map()); // pathname -> scrollY
    const currentPathname = useRef(null);
    const isFirstRender = useRef(true);
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Kontinuierlich die aktuelle Scroll-Position für die aktuelle Route speichern
    useEffect(() => {
        const handleScroll = () => {
            if (currentPathname.current) {
                scrollPositions.current.set(
                    currentPathname.current,
                    window.scrollY
                );
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle scroll on route change
    useEffect(() => {
        const { pathname, hash, state } = location;

        // Skip scroll handling for deep links
        const scrollToParam = searchParams.get("scrollTo");
        const hasDeepLink =
            scrollToParam ||
            state?.scrollToMessageId ||
            (hash && hash.startsWith("#comment-"));

        if (hasDeepLink) {
            currentPathname.current = pathname;
            return;
        }

        // Bei erstem Render nicht scrollen (Browser handled das)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            currentPathname.current = pathname;
            return;
        }

        // Wenn wir zur selben Route navigieren, nichts tun (ScrollAwareNavLink handled das)
        if (currentPathname.current === pathname) {
            return;
        }

        // Prüfen ob wir diese Route schon besucht haben
        const savedPosition = scrollPositions.current.get(pathname);

        if (savedPosition !== undefined) {
            // Route wurde vorher besucht → restore position
            window.scrollTo({ top: savedPosition, behavior: "instant" });
        } else {
            // Neue Route → scroll to top
            window.scrollTo({ top: 0, behavior: "instant" });
        }

        currentPathname.current = pathname;
    }, [location, searchParams]);

    // Function to reset scroll position (for same-route clicks) - smooth but fast
    const resetScrollPosition = useCallback((pathname) => {
        scrollPositions.current.delete(pathname);
        smoothScrollToTop(150);
    }, []);

    return (
        <ScrollMemoryContext.Provider value={{ resetScrollPosition }}>
            {children}
        </ScrollMemoryContext.Provider>
    );
}

function useScrollMemory() {
    const context = useContext(ScrollMemoryContext);
    if (context === undefined) {
        throw new Error(
            "useScrollMemory must be used within a ScrollMemoryProvider"
        );
    }
    return context;
}

export { ScrollMemoryProvider, useScrollMemory };
