import styled from "styled-components";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { getTrendingGifs, searchGifs, getGifUrl } from "../services/klipy";
import SpinnerMini from "./SpinnerMini";

const PickerWrapper = styled.div`
    position: fixed;
    z-index: 10000;
    width: 32rem;
    max-height: 40rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
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

const GifGrid = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0.8rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
    min-height: 20rem;
    max-height: 30rem;
`;

const GifItem = styled.button`
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    background-color: var(--tertiary-background-color);
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        transform 0.15s,
        box-shadow 0.15s;

    &:hover {
        transform: scale(1.03);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    &:focus {
        outline: 2px solid var(--primary-button-color);
        outline-offset: 2px;
    }
`;

const GifImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
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

const LoadMoreButton = styled.button`
    grid-column: 1 / -1;
    padding: 1rem;
    border: 1px dashed var(--primary-border-color);
    background: transparent;
    color: var(--secondary-text-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1.3rem;
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
    const [searchQuery, setSearchQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pickerRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

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

    // Load trending GIFs on mount
    useEffect(() => {
        fetchGifs("", 1);
    }, [fetchGifs]);

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
            fetchGifs(query, 1);
        }, 300);
    }

    // Handle load more
    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGifs(searchQuery, nextPage, true);
    }

    // Handle GIF selection
    function handleSelectGif(gif) {
        const gifUrl = getGifUrl(gif, "md") || getGifUrl(gif, "sm");
        if (gifUrl) {
            onSelect(gifUrl);
            onClose();
        }
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (e.key === "Escape") {
            onClose();
        }
    }

    return (
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

                <GifGrid>
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
                            No GIFs found
                        </EmptyContainer>
                    ) : (
                        <>
                            {gifs.map((gif) => (
                                <GifItem
                                    key={gif.id || gif.slug}
                                    onClick={() => handleSelectGif(gif)}
                                    title={gif.title || "GIF"}
                                >
                                    <GifImage
                                        src={getGifUrl(gif, "sm")}
                                        alt={gif.title || "GIF"}
                                        loading="lazy"
                                    />
                                </GifItem>
                            ))}
                            {hasMore && (
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

                <Attribution>Powered by KLIPY</Attribution>
            </PickerWrapper>
        </>
    );
}

export default GifPicker;
