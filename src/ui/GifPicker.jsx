import styled from "styled-components";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    HiMagnifyingGlass,
    HiOutlineHeart,
    HiHeart,
    HiOutlineClock,
    HiXMark,
    HiFire,
    HiSquares2X2,
} from "react-icons/hi2";
import {
    getTrendingGifs,
    searchGifs,
    getGifUrl,
    getCategories,
    getRecentGifs,
    removeFromRecent,
    shareGif,
    getFavoriteGifs,
    addFavorite,
    removeFavorite,
    isFavorite,
} from "../services/klipy";
import SpinnerMini from "./SpinnerMini";

const PickerWrapper = styled.div`
    position: fixed;
    z-index: 10000;
    width: 32rem;
    max-width: calc(100vw - 2rem);
    max-height: 40rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* Prevent touch events from propagating through */
    touch-action: pan-y;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    /* Block all touch interactions with elements behind */
    touch-action: none;
`;

const SearchContainer = styled.div`
    padding: 1rem;
    border-bottom: 1px solid var(--primary-border-color);
`;

const SearchInputWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    background-color: var(--primary-input-background-color);
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);

    &:focus-within {
        border-color: var(--primary-input-border-color-active);
    }

    & svg {
        color: var(--tertiary-text-color);
        font-size: 1.6rem;
        flex-shrink: 0;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 1.4rem;
    outline: none;

    &::placeholder {
        color: var(--tertiary-text-color);
    }
`;

const TabBar = styled.div`
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
`;

const TabButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.8rem 0.4rem;
    border: none;
    background: ${(props) =>
        props.$active ? "var(--secondary-background-color)" : "transparent"};
    color: ${(props) =>
        props.$active
            ? "var(--primary-text-color)"
            : "var(--tertiary-text-color)"};
    font-size: 1.1rem;
    font-weight: ${(props) => (props.$active ? "500" : "400")};
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid
        ${(props) =>
            props.$active ? "var(--primary-button-color)" : "transparent"};
    white-space: nowrap;
    overflow: hidden;
    min-width: 0;

    &:hover {
        color: var(--primary-text-color);
        background-color: ${(props) =>
            props.$active
                ? "var(--secondary-background-color)"
                : "var(--tertiary-background-color)"};
    }

    & svg {
        font-size: 1.4rem;
        flex-shrink: 0;
    }

    & span {
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const GifGrid = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0.8rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: min-content;
    gap: 0.8rem;
    min-height: 20rem;
    max-height: 30rem;
    align-content: start;
`;

const GifImage = styled.img`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const GifOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.4) 0%,
        transparent 30%,
        transparent 70%,
        rgba(0, 0, 0, 0.4) 100%
    );
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.4rem;
`;

const GifItemWrapper = styled.div`
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    background-color: var(--tertiary-background-color);

    &:hover ${GifOverlay} {
        opacity: 1;
    }
`;

const GifButton = styled.div`
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background: transparent;
    width: 100%;
    transition: transform 0.15s, box-shadow 0.15s;

    &:hover {
        transform: scale(1.03);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
`;

const IconButton = styled.button`
    border: none;
    padding: 0.3rem;
    margin: 0;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border-radius: var(--border-radius-sm);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: scale(1.1);
    }

    & svg {
        font-size: 1.4rem;
    }

    &.favorite svg {
        color: var(--color-red-700);
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--tertiary-text-color);
`;

const ErrorContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--color-red-700);
    font-size: 1.3rem;
    text-align: center;
`;

const EmptyContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

const Attribution = styled.div`
    padding: 0.6rem 1rem;
    text-align: center;
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    border-top: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
`;

const LoadMoreTrigger = styled.div`
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 4rem;
`;

const CategoriesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
    padding: 0.8rem;
    overflow-y: auto;
    max-height: 30rem;
    min-height: 20rem;
    align-content: start;
`;

const CategoryButton = styled.button`
    position: relative;
    padding: 0;
    border: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
    width: 100%;
    height: 0;
    padding-bottom: 100%; /* Square aspect ratio using padding trick */

    &:hover {
        transform: scale(1.03);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
`;

const CategoryPreview = styled.img`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const CategoryLabel = styled.span`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.8rem 0.4rem;
    background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.4) 60%,
        transparent 100%
    );
    color: white;
    font-size: 1.2rem;
    font-weight: 500;
    text-align: center;
    text-transform: capitalize;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const TABS = {
    TRENDING: "trending",
    CATEGORIES: "categories",
    RECENT: "recent",
    FAVORITES: "favorites",
};

// Calculate position for the picker
function calculatePosition(triggerRef, position, align) {
    if (!triggerRef?.current) return { top: -9999, left: -9999 };

    const rect = triggerRef.current.getBoundingClientRect();
    const pickerHeight = 400;
    const pickerWidth = 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top, left;

    if (position === "top" || rect.bottom + pickerHeight > viewportHeight) {
        top = Math.max(10, rect.top - pickerHeight - 8);
    } else {
        top = rect.bottom + 8;
    }

    if (align === "right") {
        left = Math.max(10, rect.right - pickerWidth);
    } else {
        left = rect.left;
    }

    if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 10;
    }

    return { top, left };
}

function GifPicker({
    onSelect,
    onClose,
    position = "top",
    align = "right",
    triggerRef,
}) {
    const [activeTab, setActiveTab] = useState(TABS.TRENDING);
    const [searchQuery, setSearchQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [favoriteSlugs, setFavoriteSlugs] = useState(() =>
        getFavoriteGifs().map((f) => f.slug || f.id)
    );
    const pickerRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const categorySearchRef = useRef(false); // Track if search was from category click
    const loadMoreTriggerRef = useRef(null);
    const gifGridRef = useRef(null);

    // Calculate initial position synchronously
    const initialPosition = useMemo(
        () => calculatePosition(triggerRef, position, align),
        [triggerRef, position, align]
    );

    const [pickerPosition, setPickerPosition] = useState(initialPosition);

    // Update position if needed
    useEffect(() => {
        setPickerPosition(calculatePosition(triggerRef, position, align));
    }, [triggerRef, position, align]);

    // Fetch GIFs
    const fetchGifs = useCallback(async (query, pageNum, append = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError(null);
            }

            const result = query
                ? await searchGifs(query, pageNum)
                : await getTrendingGifs(pageNum);

            setGifs((prev) =>
                append ? [...prev, ...result.items] : result.items
            );
            setHasMore(result.hasMore);
        } catch (err) {
            setError(err.message || "Failed to load GIFs");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Fetch recent GIFs
    const fetchRecentGifs = useCallback(async (pageNum, append = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError(null);
            }

            const result = await getRecentGifs(pageNum);

            setGifs((prev) =>
                append ? [...prev, ...result.items] : result.items
            );
            setHasMore(result.hasMore);
        } catch (err) {
            setError(err.message || "Failed to load recent GIFs");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            setGifs([]); // Clear gifs to prevent showing old data

            const result = await getCategories();
            setCategories(result);
        } catch (err) {
            setError(err.message || "Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load favorites from localStorage
    const loadFavorites = useCallback(() => {
        setIsLoading(true);
        setError(null);

        try {
            const favorites = getFavoriteGifs();
            setGifs(favorites);
            setHasMore(false);
        } catch (err) {
            setError("Failed to load favorites");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle tab change - also runs on mount to load initial data
    useEffect(() => {
        // Skip if this tab change was triggered by a category search
        if (categorySearchRef.current) {
            categorySearchRef.current = false;
            return;
        }

        setPage(1);
        setSearchQuery("");

        switch (activeTab) {
            case TABS.TRENDING:
                fetchGifs("", 1);
                break;
            case TABS.CATEGORIES:
                fetchCategories();
                break;
            case TABS.RECENT:
                fetchRecentGifs(1);
                break;
            case TABS.FAVORITES:
                loadFavorites();
                break;
            default:
                break;
        }
    }, [activeTab, fetchGifs, fetchRecentGifs, fetchCategories, loadFavorites]);

    // Focus search input on mount
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeoutId);
    }, []);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                onClose();
            }
        }

        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchend", handleClickOutside);
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchend", handleClickOutside);
        };
    }, [onClose]);

    // Capture all wheel events and forward them to the picker's scrollable area
    useEffect(() => {
        function handleWheel(event) {
            if (!pickerRef.current) return;

            // Find the GifGrid scroll container
            const scrollContainer = pickerRef.current.querySelector(
                '[data-gif-grid="true"]'
            );

            if (scrollContainer) {
                // Prevent default scroll behavior everywhere
                event.preventDefault();
                // Forward the scroll to the gif picker
                scrollContainer.scrollTop += event.deltaY;
            }
        }

        // Capture wheel events on the entire document
        document.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            document.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Prevent touch scroll events from propagating to elements behind the picker
    useEffect(() => {
        const pickerElement = pickerRef.current;
        if (!pickerElement) return;

        function handleTouchMove(event) {
            // Allow scrolling within the picker, but prevent it from bubbling
            event.stopPropagation();
        }

        pickerElement.addEventListener("touchmove", handleTouchMove, {
            passive: true,
        });
        return () => {
            pickerElement.removeEventListener("touchmove", handleTouchMove);
        };
    }, []);

    // Infinite scroll - load more when trigger is visible
    useEffect(() => {
        const trigger = loadMoreTriggerRef.current;
        const container = gifGridRef.current;
        if (!trigger || !container || !hasMore || isLoading || isLoadingMore)
            return;
        if (activeTab === TABS.FAVORITES || activeTab === TABS.CATEGORIES)
            return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    const nextPage = page + 1;
                    setPage(nextPage);

                    if (activeTab === TABS.RECENT) {
                        fetchRecentGifs(nextPage, true);
                    } else {
                        fetchGifs(searchQuery, nextPage, true);
                    }
                }
            },
            { root: container, threshold: 0.1 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, [
        hasMore,
        isLoading,
        isLoadingMore,
        activeTab,
        page,
        searchQuery,
        fetchGifs,
        fetchRecentGifs,
    ]);

    // Handle search with debounce
    function handleSearchChange(e) {
        const query = e.target.value;
        setSearchQuery(query);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            setPage(1);
            setActiveTab(TABS.TRENDING); // Switch to trending tab for search
            fetchGifs(query, 1);
        }, 300);
    }

    // Handle GIF selection
    function handleSelectGif(gif) {
        const gifUrl = getGifUrl(gif, "md") || getGifUrl(gif, "sm");
        if (gifUrl) {
            // Fire-and-forget share analytics - this also saves to recent history
            const slug = gif.slug || gif.id;
            if (slug) {
                shareGif(slug, searchQuery);
            }

            onSelect(gifUrl);
            onClose();
        }
    }

    // Handle toggle favorite
    function handleToggleFavorite(e, gif) {
        e.stopPropagation();
        const slug = gif.slug || gif.id;

        if (isFavorite(slug)) {
            removeFavorite(slug);
            setFavoriteSlugs((prev) => prev.filter((s) => s !== slug));

            // If on favorites tab, also remove from display
            if (activeTab === TABS.FAVORITES) {
                setGifs((prev) =>
                    prev.filter((g) => (g.slug || g.id) !== slug)
                );
            }
        } else {
            addFavorite(gif);
            setFavoriteSlugs((prev) => [...prev, slug]);
        }
    }

    // Handle remove from recent
    async function handleRemoveFromRecent(e, gif) {
        e.stopPropagation();
        const slug = gif.slug || gif.id;

        try {
            await removeFromRecent(slug);
            setGifs((prev) => prev.filter((g) => (g.slug || g.id) !== slug));
        } catch (err) {
            console.error("Failed to remove from recent:", err);
        }
    }

    // Handle category click
    function handleCategoryClick(category) {
        const searchTerm =
            category.query || category.category || category.name || category;

        // Set ref to prevent tab change effect from overwriting our search
        categorySearchRef.current = true;

        setSearchQuery(searchTerm);
        setPage(1);
        setActiveTab(TABS.TRENDING);
        fetchGifs(searchTerm, 1);
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (e.key === "Escape") {
            onClose();
        }
    }

    // Render GIF item with overlay actions
    function renderGifItem(gif, showRemoveFromRecent = false) {
        const slug = gif.slug || gif.id;
        const isFav = favoriteSlugs.includes(slug);

        return (
            <GifButton
                key={slug}
                onClick={() => handleSelectGif(gif)}
                title={gif.title || "GIF"}
            >
                <GifItemWrapper>
                    <GifImage
                        src={getGifUrl(gif, "sm")}
                        alt={gif.title || "GIF"}
                        loading="lazy"
                    />
                    <GifOverlay>
                        <IconButton
                            className={isFav ? "favorite" : ""}
                            onClick={(e) => handleToggleFavorite(e, gif)}
                            title={
                                isFav
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                            }
                        >
                            {isFav ? <HiHeart /> : <HiOutlineHeart />}
                        </IconButton>
                        {showRemoveFromRecent && (
                            <IconButton
                                onClick={(e) => handleRemoveFromRecent(e, gif)}
                                title="Remove from recent"
                            >
                                <HiXMark />
                            </IconButton>
                        )}
                    </GifOverlay>
                </GifItemWrapper>
            </GifButton>
        );
    }

    return createPortal(
        <>
            <Overlay onClick={onClose} />
            <PickerWrapper
                ref={pickerRef}
                style={{ top: pickerPosition.top, left: pickerPosition.left }}
                onKeyDown={handleKeyDown}
            >
                <SearchContainer>
                    <SearchInputWrapper>
                        <HiMagnifyingGlass />
                        <SearchInput
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search KLIPY"
                        />
                    </SearchInputWrapper>
                </SearchContainer>

                <TabBar>
                    <TabButton
                        $active={activeTab === TABS.FAVORITES}
                        onClick={() => setActiveTab(TABS.FAVORITES)}
                    >
                        <HiOutlineHeart />
                        Favorites
                    </TabButton>
                    <TabButton
                        $active={activeTab === TABS.RECENT}
                        onClick={() => setActiveTab(TABS.RECENT)}
                    >
                        <HiOutlineClock />
                        Recent
                    </TabButton>
                    <TabButton
                        $active={activeTab === TABS.TRENDING}
                        onClick={() => setActiveTab(TABS.TRENDING)}
                    >
                        <HiFire />
                        Trending
                    </TabButton>
                    <TabButton
                        $active={activeTab === TABS.CATEGORIES}
                        onClick={() => setActiveTab(TABS.CATEGORIES)}
                    >
                        <HiSquares2X2 />
                        Categories
                    </TabButton>
                </TabBar>

                {activeTab === TABS.CATEGORIES ? (
                    <CategoriesGrid data-gif-grid="true">
                        {isLoading ? (
                            <LoadingContainer style={{ gridColumn: "1 / -1" }}>
                                <SpinnerMini />
                            </LoadingContainer>
                        ) : error ? (
                            <ErrorContainer style={{ gridColumn: "1 / -1" }}>
                                {error}
                            </ErrorContainer>
                        ) : categories.length === 0 ? (
                            <EmptyContainer style={{ gridColumn: "1 / -1" }}>
                                No categories found
                            </EmptyContainer>
                        ) : (
                            categories.map((category, index) => (
                                <CategoryButton
                                    key={
                                        category.query ||
                                        category.category ||
                                        index
                                    }
                                    onClick={() =>
                                        handleCategoryClick(category)
                                    }
                                    title={category.category}
                                >
                                    {category.preview_url && (
                                        <CategoryPreview
                                            src={category.preview_url}
                                            alt={category.category}
                                            loading="lazy"
                                        />
                                    )}
                                    <CategoryLabel>
                                        {category.category}
                                    </CategoryLabel>
                                </CategoryButton>
                            ))
                        )}
                    </CategoriesGrid>
                ) : (
                    <GifGrid data-gif-grid="true" ref={gifGridRef}>
                        {isLoading ? (
                            <LoadingContainer style={{ gridColumn: "1 / -1" }}>
                                <SpinnerMini />
                            </LoadingContainer>
                        ) : error ? (
                            <ErrorContainer style={{ gridColumn: "1 / -1" }}>
                                {error}
                            </ErrorContainer>
                        ) : gifs.length === 0 ? (
                            <EmptyContainer style={{ gridColumn: "1 / -1" }}>
                                {activeTab === TABS.FAVORITES
                                    ? "No favorites yet. Click the ❤️ on a GIF to save it."
                                    : activeTab === TABS.RECENT
                                    ? "No recent GIFs yet."
                                    : "No GIFs found"}
                            </EmptyContainer>
                        ) : (
                            <>
                                {gifs.map((gif) =>
                                    renderGifItem(
                                        gif,
                                        activeTab === TABS.RECENT
                                    )
                                )}
                                {hasMore && activeTab !== TABS.FAVORITES && (
                                    <LoadMoreTrigger ref={loadMoreTriggerRef}>
                                        {isLoadingMore && <SpinnerMini />}
                                    </LoadMoreTrigger>
                                )}
                            </>
                        )}
                    </GifGrid>
                )}

                <Attribution>Powered by KLIPY</Attribution>
            </PickerWrapper>
        </>,
        document.body
    );
}

export default GifPicker;
