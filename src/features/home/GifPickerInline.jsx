import styled from "styled-components";
import { useState, useRef, useEffect, useCallback } from "react";
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
} from "../../services/klipy";
import SpinnerMini from "../../ui/SpinnerMini";

const PickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
`;

const SearchContainer = styled.div`
    padding: 0.8rem;
    border-bottom: 1px solid var(--primary-border-color);
    flex-shrink: 0;
`;

const SearchInputWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 1rem;
    background-color: var(--primary-input-background-color);
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);

    &:focus-within {
        border-color: var(--primary-input-border-color-active);
    }

    & svg {
        color: var(--tertiary-text-color);
        font-size: 1.4rem;
        flex-shrink: 0;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 1.3rem;
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
    flex-shrink: 0;
`;

const TabButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 0.4rem;
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
        font-size: 1.3rem;
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
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: min-content;
    gap: 0.6rem;
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
        font-size: 1.2rem;
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
    grid-column: 1 / -1;
`;

const ErrorContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--color-red-700);
    font-size: 1.2rem;
    text-align: center;
    grid-column: 1 / -1;
`;

const EmptyContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--tertiary-text-color);
    font-size: 1.2rem;
    grid-column: 1 / -1;
`;

const LoadMoreButton = styled.button`
    grid-column: 1 / -1;
    padding: 0.8rem;
    border: 1px dashed var(--primary-border-color);
    background: transparent;
    color: var(--secondary-text-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s;

    &:hover {
        background-color: var(--tertiary-background-color);
        color: var(--primary-text-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CategoriesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    padding: 0.8rem;
    overflow-y: auto;
    flex: 1;
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
    padding-bottom: 100%;

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
    padding: 0.6rem 0.4rem;
    background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.4) 60%,
        transparent 100%
    );
    color: white;
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
    text-transform: capitalize;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const Attribution = styled.div`
    padding: 0.4rem 0.8rem;
    text-align: center;
    font-size: 1rem;
    color: var(--tertiary-text-color);
    border-top: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
    flex-shrink: 0;
`;

const TABS = {
    TRENDING: "trending",
    CATEGORIES: "categories",
    RECENT: "recent",
    FAVORITES: "favorites",
};

function GifPickerInline({ onSelect }) {
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
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const categorySearchRef = useRef(false);

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
            setGifs([]);

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

    // Handle tab change
    useEffect(() => {
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

    // Handle search with debounce
    function handleSearchChange(e) {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setPage(1);
            setActiveTab(TABS.TRENDING);
            fetchGifs(query, 1);
        }, 300);
    }

    // Handle load more
    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);

        if (activeTab === TABS.RECENT) {
            fetchRecentGifs(nextPage, true);
        } else {
            fetchGifs(searchQuery, nextPage, true);
        }
    }

    // Handle GIF selection
    function handleSelectGif(gif) {
        const gifUrl = getGifUrl(gif, "md") || getGifUrl(gif, "sm");
        if (gifUrl) {
            const slug = gif.slug || gif.id;
            if (slug) {
                shareGif(slug, searchQuery);
            }
            onSelect(gifUrl);
        }
    }

    // Handle toggle favorite
    function handleToggleFavorite(e, gif) {
        e.stopPropagation();
        const slug = gif.slug || gif.id;

        if (isFavorite(slug)) {
            removeFavorite(slug);
            setFavoriteSlugs((prev) => prev.filter((s) => s !== slug));

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

        categorySearchRef.current = true;

        setSearchQuery(searchTerm);
        setPage(1);
        setActiveTab(TABS.TRENDING);
        fetchGifs(searchTerm, 1);
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

    return (
        <PickerContainer>
            <SearchContainer>
                <SearchInputWrapper>
                    <HiMagnifyingGlass />
                    <SearchInput
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search GIFs..."
                    />
                </SearchInputWrapper>
            </SearchContainer>

            <TabBar>
                <TabButton
                    $active={activeTab === TABS.FAVORITES}
                    onClick={() => setActiveTab(TABS.FAVORITES)}
                    title="Favorites"
                >
                    <HiOutlineHeart />
                </TabButton>
                <TabButton
                    $active={activeTab === TABS.RECENT}
                    onClick={() => setActiveTab(TABS.RECENT)}
                    title="Recent"
                >
                    <HiOutlineClock />
                </TabButton>
                <TabButton
                    $active={activeTab === TABS.TRENDING}
                    onClick={() => setActiveTab(TABS.TRENDING)}
                    title="Trending"
                >
                    <HiFire />
                </TabButton>
                <TabButton
                    $active={activeTab === TABS.CATEGORIES}
                    onClick={() => setActiveTab(TABS.CATEGORIES)}
                    title="Categories"
                >
                    <HiSquares2X2 />
                </TabButton>
            </TabBar>

            {activeTab === TABS.CATEGORIES ? (
                <CategoriesGrid>
                    {isLoading ? (
                        <LoadingContainer>
                            <SpinnerMini />
                        </LoadingContainer>
                    ) : error ? (
                        <ErrorContainer>{error}</ErrorContainer>
                    ) : categories.length === 0 ? (
                        <EmptyContainer>No categories found</EmptyContainer>
                    ) : (
                        categories.map((category, index) => (
                            <CategoryButton
                                key={
                                    category.query || category.category || index
                                }
                                onClick={() => handleCategoryClick(category)}
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
                <GifGrid>
                    {isLoading ? (
                        <LoadingContainer>
                            <SpinnerMini />
                        </LoadingContainer>
                    ) : error ? (
                        <ErrorContainer>{error}</ErrorContainer>
                    ) : gifs.length === 0 ? (
                        <EmptyContainer>
                            {activeTab === TABS.FAVORITES
                                ? "No favorites yet. Click ❤️ on a GIF to save it."
                                : activeTab === TABS.RECENT
                                ? "No recent GIFs yet."
                                : "No GIFs found"}
                        </EmptyContainer>
                    ) : (
                        <>
                            {gifs.map((gif) =>
                                renderGifItem(gif, activeTab === TABS.RECENT)
                            )}
                            {hasMore && activeTab !== TABS.FAVORITES && (
                                <LoadMoreButton
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <SpinnerMini />
                                    ) : (
                                        "Load more"
                                    )}
                                </LoadMoreButton>
                            )}
                        </>
                    )}
                </GifGrid>
            )}

            <Attribution>Powered by KLIPY</Attribution>
        </PickerContainer>
    );
}

export default GifPickerInline;
